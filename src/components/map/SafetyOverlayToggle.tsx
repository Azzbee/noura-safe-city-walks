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
      className={cn(
        "shadow-lg transition-all",
        visible && "bg-safe/20 border-safe text-safe hover:bg-safe/30"
      )}
    >
      {visible ? (
        <>
          <X className="w-4 h-4 mr-2" />
          Hide Safety
        </>
      ) : (
        <>
          <Layers className="w-4 h-4 mr-2" />
          Show Safety
        </>
      )}
    </Button>
  );
}
