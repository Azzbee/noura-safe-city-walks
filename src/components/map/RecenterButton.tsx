import { Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecenterButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function RecenterButton({ onClick, disabled, className }: RecenterButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-10 w-10 bg-card/90 backdrop-blur-sm border-border hover:bg-accent hover:border-primary/50 transition-all",
        className
      )}
      aria-label="Center on my location"
    >
      <Crosshair className="h-5 w-5 text-primary" />
    </Button>
  );
}
