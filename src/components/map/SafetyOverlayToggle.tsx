import { Button } from '@/components/ui/button';
import { Layers, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyOverlayToggleProps {
  visible: boolean;
  loading: boolean;
  onToggle: () => void;
}

export default function SafetyOverlayToggle({ 
  visible, 
  loading, 
  onToggle 
}: SafetyOverlayToggleProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onToggle}
      disabled={loading}
      aria-label={visible ? 'Hide safety layer' : 'Show safety layer'}
      className={cn(
        "shadow-lg transition-all",
        visible && "bg-safe/20 border-safe text-safe hover:bg-safe/30"
      )}
    >
      {visible ? (
        <>
          <X className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Hide Safety</span>
        </>
      ) : (
        <>
          <Layers className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Show Safety</span>
        </>
      )}
    </Button>
  );
}
