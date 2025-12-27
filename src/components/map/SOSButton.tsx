import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  onPress: () => void;
  className?: string;
  size?: 'default' | 'large';
}

export default function SOSButton({
  onPress,
  className,
  size = 'default',
}: SOSButtonProps) {
  const isLarge = size === 'large';

  return (
    <Button
      variant="destructive"
      onClick={onPress}
      className={cn(
        'animate-pulse-danger font-bold shadow-lg',
        isLarge
          ? 'h-20 w-20 rounded-full text-lg gap-2 flex-col'
          : 'h-12 px-6 rounded-full gap-2',
        className
      )}
    >
      <AlertTriangle className={cn(isLarge ? 'w-8 h-8' : 'w-5 h-5')} />
      <span>SOS</span>
    </Button>
  );
}
