import { Sun, Moon, MoonStar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeFilter } from '@/hooks/useSafetyOverlays';
import { cn } from '@/lib/utils';

interface SafetyTimeFilterProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  className?: string;
}

const timeOptions: { value: TimeFilter; label: string; icon: typeof Sun; shortLabel: string }[] = [
  { value: 'all', label: 'All Times', icon: Clock, shortLabel: 'All' },
  { value: 'day', label: 'Daytime', icon: Sun, shortLabel: 'Day' },
  { value: 'night', label: 'Night', icon: Moon, shortLabel: 'Night' },
  { value: 'late_night', label: 'Late Night', icon: MoonStar, shortLabel: 'Late' },
];

export default function SafetyTimeFilter({
  value,
  onChange,
  className,
}: SafetyTimeFilterProps) {
  return (
    <div className={cn('flex gap-1 bg-card/90 backdrop-blur-sm rounded-lg p-1 border border-primary/20', className)}>
      {timeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 gap-1 px-2 py-1 h-8 text-xs font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{option.shortLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
