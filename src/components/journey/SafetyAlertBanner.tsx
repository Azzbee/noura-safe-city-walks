import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyAlertBannerProps {
  isInDangerZone: boolean;
  nearbyAlertCount: number;
  onDismiss?: () => void;
  className?: string;
}

export default function SafetyAlertBanner({
  isInDangerZone,
  nearbyAlertCount,
  onDismiss,
  className,
}: SafetyAlertBannerProps) {
  if (nearbyAlertCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        className={cn(
          'rounded-lg border px-4 py-3 flex items-center gap-3 shadow-lg',
          isInDangerZone
            ? 'bg-danger/20 border-danger/50 text-danger'
            : 'bg-warning/20 border-warning/50 text-warning',
          className
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {isInDangerZone ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
        </motion.div>

        <div className="flex-1">
          <div className="font-medium text-sm">
            {isInDangerZone
              ? 'Safety Alert: High-risk area'
              : `${nearbyAlertCount} safety concern${nearbyAlertCount > 1 ? 's' : ''} nearby`}
          </div>
          <div className="text-xs opacity-80">
            {isInDangerZone
              ? 'Stay alert and consider an alternative route'
              : 'Stay aware of your surroundings'}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-background/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
