import { useState } from 'react';
import { AlertTriangle, Plus, Shield, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportType, TimeRelevance, useSafetyReports } from '@/hooks/useSafetyReports';
import { cn } from '@/lib/utils';

interface QuickReportButtonProps {
  lat: number;
  lng: number;
  className?: string;
}

const reportOptions: { type: ReportType; label: string; icon: typeof AlertTriangle; color: string; bgColor: string }[] = [
  { type: 'danger', label: 'Danger', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40' },
  { type: 'caution', label: 'Caution', icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40' },
  { type: 'poorly_lit', label: 'Dark Area', icon: Moon, color: 'text-slate-400', bgColor: 'bg-slate-500/20 hover:bg-slate-500/30 border-slate-500/40' },
  { type: 'safe', label: 'Safe', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40' },
  { type: 'well_lit', label: 'Well Lit', icon: Sun, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/40' },
];

export default function QuickReportButton({ lat, lng, className }: QuickReportButtonProps) {
  const { createReport } = useSafetyReports();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleQuickReport = async (type: ReportType) => {
    setSubmitting(true);
    try {
      // Determine time relevance based on current time
      const hour = new Date().getHours();
      let timeRelevance: TimeRelevance = 'always';
      if (type === 'poorly_lit' || type === 'well_lit') {
        if (hour >= 18 || hour < 6) {
          timeRelevance = hour >= 22 || hour < 5 ? 'late_night' : 'night_only';
        } else {
          timeRelevance = 'day_only';
        }
      }
      
      await createReport(lat, lng, type, undefined, timeRelevance, undefined);
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 flex flex-col gap-2 p-2 bg-card/95 backdrop-blur-md rounded-xl border border-primary/30 shadow-lg shadow-black/20"
          >
            {reportOptions.map((option, index) => (
              <motion.div
                key={option.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickReport(option.type)}
                  disabled={submitting}
                  className={cn(
                    'w-full justify-start gap-2 border',
                    option.bgColor
                  )}
                >
                  <option.icon className={cn('w-4 h-4', option.color)} />
                  <span className="text-sm">{option.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 rounded-full p-0 shadow-lg transition-all duration-300',
          isOpen
            ? 'bg-muted hover:bg-muted/80 rotate-45'
            : 'bg-primary hover:bg-primary/90'
        )}
        aria-label={isOpen ? 'Close report menu' : 'Quick safety report'}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
