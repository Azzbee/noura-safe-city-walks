import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, Bell } from 'lucide-react';
import { triggerCheckinFeedback, triggerSuccessFeedback, triggerSOSFeedback } from '@/lib/haptics';

interface CheckinPromptProps {
  onRespond: (response: 'safe' | 'help') => void;
}

export default function CheckinPrompt({ onRespond }: CheckinPromptProps) {
  // Trigger feedback when prompt appears
  useEffect(() => {
    triggerCheckinFeedback();
  }, []);

  const handleSafeResponse = () => {
    triggerSuccessFeedback();
    onRespond('safe');
  };

  const handleHelpResponse = () => {
    triggerSOSFeedback();
    onRespond('help');
  };

  return (
    <Card className="bg-card/95 backdrop-blur border-primary/20 shadow-lg animate-fade-in-scale">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
          <Bell className="w-5 h-5 text-primary animate-pulse" />
          Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          How are you doing?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleSafeResponse}
            className="flex-1 bg-safe hover:bg-safe/90 active:scale-95 transition-transform"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            I'm Safe
          </Button>
          <Button
            onClick={handleHelpResponse}
            variant="destructive"
            className="flex-1 active:scale-95 transition-transform"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Need Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
