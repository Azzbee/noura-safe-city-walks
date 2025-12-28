import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Sun, Moon, Clock, MapPin } from 'lucide-react';
import { ReportType, TimeRelevance, useSafetyReports } from '@/hooks/useSafetyReports';
import { cn } from '@/lib/utils';

interface SafetyReportDialogProps {
  lat: number;
  lng: number;
  trigger?: React.ReactNode;
}

export default function SafetyReportDialog({ lat, lng, trigger }: SafetyReportDialogProps) {
  const { createReport } = useSafetyReports();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('caution');
  const [timeRelevance, setTimeRelevance] = useState<TimeRelevance>('always');
  const [description, setDescription] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [submitting, setSubmitting] = useState(false);

  const reportTypes: { value: ReportType; label: string; icon: typeof AlertTriangle; color: string }[] = [
    { value: 'danger', label: 'Danger', icon: AlertTriangle, color: 'text-destructive' },
    { value: 'caution', label: 'Caution', icon: AlertTriangle, color: 'text-warning' },
    { value: 'poorly_lit', label: 'Poorly Lit', icon: Moon, color: 'text-muted-foreground' },
    { value: 'safe', label: 'Safe Area', icon: Shield, color: 'text-safe' },
    { value: 'well_lit', label: 'Well Lit', icon: Sun, color: 'text-primary' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const expiresInHours = expiresIn === 'never' ? undefined : parseInt(expiresIn);
      await createReport(lat, lng, reportType, description || undefined, timeRelevance, expiresInHours);
      setOpen(false);
      setDescription('');
      setReportType('caution');
      setTimeRelevance('always');
      setExpiresIn('never');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className="gap-2">
            <MapPin className="w-4 h-4" />
            Report Safety
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Report Safety Concern
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div className="space-y-3">
            <Label>Type of Report</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
              className="grid grid-cols-2 gap-2"
            >
              {reportTypes.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                    reportType === type.value 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                  <type.icon className={cn("w-4 h-4", type.color)} />
                  <span className="text-sm">{type.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Time Relevance */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              When is this relevant?
            </Label>
            <Select value={timeRelevance} onValueChange={(v) => setTimeRelevance(v as TimeRelevance)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="day_only">Daytime only (6am-6pm)</SelectItem>
                <SelectItem value="night_only">Nighttime (6pm-12am)</SelectItem>
                <SelectItem value="late_night">Late night (12am-6am)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should others know about this location?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label>Report expires</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="24">In 24 hours</SelectItem>
                <SelectItem value="72">In 3 days</SelectItem>
                <SelectItem value="168">In 1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
