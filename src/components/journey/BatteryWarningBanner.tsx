import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryWarning, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BatteryStatus } from '@/hooks/useBatteryMonitor';
import { cn } from '@/lib/utils';

interface BatteryWarningBannerProps {
  battery: BatteryStatus;
  onNotifyContacts?: () => void;
  className?: string;
}

export default function BatteryWarningBanner({
  battery,
  onNotifyContacts,
  className,
}: BatteryWarningBannerProps) {
  if (!battery.isSupported || battery.charging || (!battery.isLow && !battery.isCritical)) {
    return null;
  }

  const isCritical = battery.isCritical;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm",
        isCritical 
          ? "bg-destructive/20 border-destructive/40" 
          : "bg-warning/20 border-warning/40",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isCritical ? "bg-destructive/20" : "bg-warning/20"
      )}>
        {isCritical ? (
          <BatteryWarning className="w-5 h-5 text-destructive animate-pulse" />
        ) : (
          <BatteryLow className="w-5 h-5 text-warning" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          isCritical ? "text-destructive" : "text-warning"
        )}>
          {isCritical ? 'Critical Battery' : 'Low Battery'}
        </p>
        <p className="text-xs text-muted-foreground">
          {battery.level}% remaining
          {isCritical && ' - Phone may shut down soon'}
        </p>
      </div>

      {isCritical && onNotifyContacts && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onNotifyContacts}
          className="flex-shrink-0"
        >
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          Notify
        </Button>
      )}
    </motion.div>
  );
}
