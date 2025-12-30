import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind, Eye, CloudRain } from 'lucide-react';
import { WeatherData, WeatherCondition } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  condition: WeatherCondition | null;
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

export default function WeatherWidget({
  weather,
  condition,
  loading,
  className,
  compact = false,
}: WeatherWidgetProps) {
  if (!weather || !condition) {
    if (loading) {
      return (
        <div className={cn(
          "px-3 py-2 rounded-lg bg-card/80 backdrop-blur border border-border/50",
          "animate-pulse",
          className
        )}>
          <div className="h-6 w-16 bg-muted rounded" />
        </div>
      );
    }
    return null;
  }

  const getSafetyColor = () => {
    if (condition.safetyMultiplier >= 0.9) return 'text-safe';
    if (condition.safetyMultiplier >= 0.7) return 'text-balanced';
    if (condition.safetyMultiplier >= 0.5) return 'text-warning';
    return 'text-destructive';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-card/80 backdrop-blur border border-border/50",
          className
        )}
      >
        <span className="text-lg">{condition.icon}</span>
        <span className="text-sm font-medium">{Math.round(weather.temperature)}°</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-xl bg-card/90 backdrop-blur border border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{condition.icon}</span>
        <div>
          <p className="text-lg font-display font-bold">
            {Math.round(weather.temperature)}°C
          </p>
          <p className="text-xs text-muted-foreground">
            Feels like {Math.round(weather.feelsLike)}°
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className={cn("text-sm font-medium", getSafetyColor())}>
            {condition.label}
          </p>
          {condition.safetyMultiplier < 0.7 && (
            <p className="text-xs text-warning">Low visibility</p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
          <Droplets className="w-4 h-4 text-fastest mb-1" />
          <span className="text-xs font-medium">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
          <Wind className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-xs font-medium">{Math.round(weather.windSpeed)}km/h</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
          <Eye className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-xs font-medium">{(weather.visibility / 1000).toFixed(1)}km</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
          <CloudRain className="w-4 h-4 text-fastest mb-1" />
          <span className="text-xs font-medium">{weather.precipitationProbability}%</span>
        </div>
      </div>
    </motion.div>
  );
}
