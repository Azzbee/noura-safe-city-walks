import { Sun, Sunset, Moon, MoonStar } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TimeOfDay } from '@/services/routing';
import { cn } from '@/lib/utils';

interface TimeOfDaySelectorProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
  className?: string;
}

const timeOptions: { value: TimeOfDay; label: string; icon: typeof Sun }[] = [
  { value: 'day', label: 'Day', icon: Sun },
  { value: 'evening', label: 'Evening', icon: Sunset },
  { value: 'night', label: 'Night', icon: Moon },
  { value: 'late_night', label: 'Late', icon: MoonStar },
];

export default function TimeOfDaySelector({
  value,
  onChange,
  className,
}: TimeOfDaySelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as TimeOfDay)}
      className={cn('bg-card rounded-lg p-1', className)}
    >
      {timeOptions.map((option) => {
        const Icon = option.icon;
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className="flex-1 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
