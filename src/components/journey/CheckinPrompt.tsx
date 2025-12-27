import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface CheckinPromptProps {
  onRespond: (response: 'safe' | 'help') => void;
}

export default function CheckinPrompt({ onRespond }: CheckinPromptProps) {
  return (
    <Card className="bg-card/95 backdrop-blur border-primary/20 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-center">Check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          How are you doing?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => onRespond('safe')}
            className="flex-1 bg-safe hover:bg-safe/90"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            I'm Safe
          </Button>
          <Button
            onClick={() => onRespond('help')}
            variant="destructive"
            className="flex-1"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Need Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
