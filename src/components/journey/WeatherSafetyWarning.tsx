import { motion } from 'framer-motion';
import { AlertTriangle, CloudRain, Wind, Thermometer, Eye } from 'lucide-react';
import { WeatherCondition } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';

interface WeatherSafetyWarningProps {
  condition: WeatherCondition | null;
  warnings: string[];
  className?: string;
}

export default function WeatherSafetyWarning({
  condition,
  warnings,
  className,
}: WeatherSafetyWarningProps) {
  if (!condition || warnings.length === 0) {
    return null;
  }

  const isSerious = condition.safetyMultiplier < 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm",
        isSerious
          ? "bg-destructive/20 border-destructive/40"
          : "bg-warning/20 border-warning/40",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        isSerious ? "bg-destructive/20" : "bg-warning/20"
      )}>
        <span className="text-xl">{condition.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium mb-1",
          isSerious ? "text-destructive" : "text-warning"
        )}>
          {isSerious ? 'Weather Warning' : 'Weather Advisory'}
        </p>
        <ul className="space-y-0.5">
          {warnings.slice(0, 3).map((warning, index) => (
            <li key={index} className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
