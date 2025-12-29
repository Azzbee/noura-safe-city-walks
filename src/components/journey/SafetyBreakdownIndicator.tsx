import { SafetyBreakdown } from '@/services/routing';
import { Lightbulb, Shield, Users, Video, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyBreakdownIndicatorProps {
  breakdown: SafetyBreakdown;
  compact?: boolean;
}

const factors = [
  { key: 'lighting', icon: Lightbulb, label: 'Lighting', color: 'text-yellow-500' },
  { key: 'police_proximity', icon: Shield, label: 'Police', color: 'text-blue-500' },
  { key: 'activity', icon: Users, label: 'Busy Areas', color: 'text-green-500' },
  { key: 'cctv_coverage', icon: Video, label: 'CCTV', color: 'text-purple-500' },
  { key: 'safe_landmarks', icon: MapPin, label: 'Safe Spots', color: 'text-orange-500' },
  { key: 'time_factor', icon: Clock, label: 'Time', color: 'text-cyan-500' },
] as const;

function getBarColor(value: number): string {
  if (value >= 0.8) return 'bg-safe';
  if (value >= 0.6) return 'bg-balanced';
  if (value >= 0.4) return 'bg-warning';
  return 'bg-destructive';
}

export default function SafetyBreakdownIndicator({ breakdown, compact = false }: SafetyBreakdownIndicatorProps) {
  if (compact) {
    return (
      <div className="flex gap-1">
        {factors.map(({ key, icon: Icon, color }) => {
          const value = breakdown[key as keyof SafetyBreakdown] ?? 0.5;
          return (
            <div 
              key={key} 
              className="relative group"
              title={`${key.replace('_', ' ')}: ${Math.round(value * 100)}%`}
            >
              <Icon 
                className={cn(
                  'w-3.5 h-3.5 transition-opacity',
                  value >= 0.7 ? color : 'text-muted-foreground/50'
                )} 
              />
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn('h-full transition-all', getBarColor(value))}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2 bg-muted/30 rounded-lg">
      <div className="text-xs font-medium text-muted-foreground mb-2">Safety Factors</div>
      {factors.map(({ key, icon: Icon, label, color }) => {
        const value = breakdown[key as keyof SafetyBreakdown] ?? 0.5;
        return (
          <div key={key} className="flex items-center gap-2">
            <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', color)} />
            <span className="text-xs text-muted-foreground w-16 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn('h-full transition-all rounded-full', getBarColor(value))}
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(value * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}