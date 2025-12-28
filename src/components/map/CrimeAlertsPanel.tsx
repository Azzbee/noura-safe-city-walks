import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CrimeAlert } from '@/hooks/useCrimeAlerts';
import { formatDistanceToNow } from 'date-fns';

interface CrimeAlertsPanelProps {
  alerts: CrimeAlert[];
  loading: boolean;
  lastFetched: Date | null;
  onRefresh: () => void;
}

export default function CrimeAlertsPanel({
  alerts,
  loading,
  lastFetched,
  onRefresh,
}: CrimeAlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const highSeverityCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumSeverityCount = alerts.filter((a) => a.severity === 'medium').length;

  const getSeverityColor = (severity: CrimeAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: CrimeAlert['severity']) => {
    if (severity === 'high') {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return null;
  };

  return (
    <div className="pointer-events-auto">
      <motion.div
        layout
        className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-lg"
        style={{ maxWidth: '320px' }}
      >
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-foreground">Crime Alerts</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {highSeverityCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {highSeverityCount} critical
                  </Badge>
                )}
                {mediumSeverityCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400">
                    {mediumSeverityCount} warning
                  </Badge>
                )}
                {alerts.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">No active alerts</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t border-border/50">
                {/* Last updated */}
                {lastFetched && (
                  <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] text-muted-foreground border-b border-border/30">
                    <Clock className="w-3 h-3" />
                    Updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
                  </div>
                )}

                {/* Alerts list */}
                <ScrollArea className="max-h-64">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>No crime alerts in your area</p>
                      <p className="text-xs mt-1">Check back later for updates</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {alerts.slice(0, 10).map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${getSeverityColor(alert.severity)}`}
                            >
                              {getSeverityIcon(alert.severity)}
                              {alert.severity}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-foreground line-clamp-2">
                                {alert.title}
                              </h4>
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                {alert.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {alert.location}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(alert.publishedAt), { addSuffix: true })}
                                </span>
                                {alert.url && (
                                  <a
                                    href={alert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                                  >
                                    Source <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Footer with source info */}
                <div className="px-3 py-2 border-t border-border/30 text-[10px] text-muted-foreground text-center">
                  Powered by NewsAPI • Updates every 15 min
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
