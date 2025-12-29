import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquarePlus, ChevronUp, ChevronDown, AlertTriangle, 
  Shield, Moon, Sun, ThumbsUp, ThumbsDown, Clock, MapPin,
  Car, Construction, Users, Zap, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SafetyReport, ReportType, TimeRelevance, useSafetyReports } from '@/hooks/useSafetyReports';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CommunityReportsPanelProps {
  userLocation: { lat: number; lng: number } | null;
  className?: string;
}

const reportTypeConfig: Record<ReportType, { 
  icon: typeof AlertTriangle; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  danger: { icon: AlertTriangle, label: 'Danger', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  caution: { icon: AlertTriangle, label: 'Caution', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  poorly_lit: { icon: Moon, label: 'Dark Area', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  safe: { icon: Shield, label: 'Safe', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  well_lit: { icon: Sun, label: 'Well Lit', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
};

// Extended report types for Waze-like functionality
const quickReportTypes = [
  { type: 'danger' as ReportType, icon: AlertTriangle, label: 'Danger', color: 'text-red-400' },
  { type: 'caution' as ReportType, icon: Construction, label: 'Obstacle', color: 'text-amber-400' },
  { type: 'poorly_lit' as ReportType, icon: Moon, label: 'Dark', color: 'text-slate-400' },
  { type: 'safe' as ReportType, icon: Users, label: 'Busy Area', color: 'text-blue-400' },
  { type: 'well_lit' as ReportType, icon: Shield, label: 'Safe', color: 'text-emerald-400' },
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CommunityReportsPanel({ userLocation, className }: CommunityReportsPanelProps) {
  const { reports, loading, createReport, vote } = useSafetyReports();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sort reports by distance from user
  const sortedReports = userLocation
    ? [...reports].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      })
    : reports;

  // Get nearby reports (within 2km)
  const nearbyReports = userLocation
    ? sortedReports.filter((r) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
        return dist < 2;
      })
    : sortedReports.slice(0, 10);

  const handleQuickReport = async (type: ReportType) => {
    if (!userLocation) return;
    
    setSubmitting(true);
    try {
      const hour = new Date().getHours();
      let timeRelevance: TimeRelevance = 'always';
      if (type === 'poorly_lit' || type === 'well_lit') {
        timeRelevance = hour >= 18 || hour < 6 ? 'night_only' : 'day_only';
      }
      
      await createReport(
        userLocation.lat,
        userLocation.lng,
        type,
        undefined,
        timeRelevance,
        12 // Expires in 12 hours
      );
      setIsAddingReport(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedReport = async () => {
    if (!userLocation || !selectedType) return;
    
    setSubmitting(true);
    try {
      await createReport(
        userLocation.lat,
        userLocation.lng,
        selectedType,
        description || undefined,
        'always',
        24
      );
      setIsAddingReport(false);
      setSelectedType(null);
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDistance = (report: SafetyReport) => {
    if (!userLocation) return null;
    const dist = calculateDistance(userLocation.lat, userLocation.lng, report.lat, report.lng);
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m away`;
    }
    return `${dist.toFixed(1)}km away`;
  };

  return (
    <Card className={cn('bg-card/95 backdrop-blur border-primary/20 w-64', className)}>
      <CardHeader 
        className="py-2 px-3 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Community Reports</CardTitle>
          {nearbyReports.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5">
              {nearbyReports.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="px-3 pb-3 pt-0 space-y-3">
              {/* Quick report buttons - Waze style */}
              {!isAddingReport ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingReport(true)}
                  disabled={!userLocation}
                  className="w-full gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Report Something Here
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">What do you see?</span>
                    <button 
                      onClick={() => setIsAddingReport(false)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Quick report grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {quickReportTypes.map((rt) => (
                      <Button
                        key={rt.type}
                        variant="ghost"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleQuickReport(rt.type)}
                        className={cn(
                          'flex-col h-auto py-2 px-1',
                          reportTypeConfig[rt.type].bgColor,
                          'hover:opacity-80'
                        )}
                      >
                        <rt.icon className={cn('w-4 h-4 mb-1', rt.color)} />
                        <span className="text-[10px]">{rt.label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Detailed report option */}
                  {selectedType && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Textarea
                        placeholder="Add details (optional)..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-16 text-xs resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={handleDetailedReport}
                        disabled={submitting}
                        className="w-full"
                      >
                        Submit Report
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Nearby reports list */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Nearby Reports</span>
                  {loading && (
                    <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                  )}
                </div>
                
                <ScrollArea className="h-40">
                  {nearbyReports.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No reports nearby. Be the first!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nearbyReports.map((report) => {
                        const config = reportTypeConfig[report.report_type as ReportType];
                        const Icon = config?.icon || AlertTriangle;
                        
                        return (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              'p-2 rounded-lg border',
                              config?.bgColor || 'bg-muted',
                              'border-border/50'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config?.color)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 text-xs font-medium">
                                  <span>{config?.label || report.report_type}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground truncate">
                                    {formatDistance(report)}
                                  </span>
                                </div>
                                {report.description && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                    {report.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-auto">
                                    <button
                                      onClick={() => vote(report.id, 1)}
                                      className={cn(
                                        'p-0.5 rounded hover:bg-background/50',
                                        report.user_vote === 1 && 'text-safe'
                                      )}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] min-w-[16px] text-center">
                                      {report.vote_count || 0}
                                    </span>
                                    <button
                                      onClick={() => vote(report.id, -1)}
                                      className={cn(
                                        'p-0.5 rounded hover:bg-background/50',
                                        report.user_vote === -1 && 'text-danger'
                                      )}
                                    >
                                      <ThumbsDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
