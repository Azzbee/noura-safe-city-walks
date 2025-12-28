import { Card } from '@/components/ui/card';
import { Shield, Sun, Users, Train, Building2, AlertTriangle, Clock, Pill, MapPin } from 'lucide-react';

export default function SafetyLegend() {
  const safeItems = [
    { icon: Sun, color: 'hsl(45, 93%, 55%)', label: 'Well-lit areas' },
    { icon: Users, color: 'hsl(160, 84%, 39%)', label: 'Busy streets' },
    { icon: Shield, color: 'hsl(217, 91%, 60%)', label: 'Police stations' },
    { icon: Building2, color: 'hsl(0, 72%, 55%)', label: 'Hospitals' },
    { icon: Train, color: 'hsl(262, 83%, 58%)', label: 'Metro stations' },
    { icon: Pill, color: 'hsl(173, 80%, 40%)', label: 'Pharmacies' },
    { icon: Clock, color: 'hsl(25, 95%, 53%)', label: '24h services' },
    { icon: MapPin, color: 'hsl(142, 71%, 45%)', label: 'Safe areas', opacity: 0.6 },
  ];

  const cautionItems = [
    { icon: AlertTriangle, color: 'hsl(48, 96%, 53%)', label: 'Caution zones' },
    { icon: AlertTriangle, color: 'hsl(0, 84%, 50%)', label: 'Danger zones' },
  ];

  return (
    <Card className="bg-card/90 backdrop-blur border-border p-3 max-w-[180px]">
      <h4 className="text-xs font-medium mb-2 text-muted-foreground">Safety Legend</h4>
      <div className="space-y-1.5 mb-3">
        {safeItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color, opacity: item.opacity ?? 1 }}
            />
            <span className="text-foreground/80">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-2 space-y-1.5">
        <p className="text-[10px] text-muted-foreground mb-1">Caution</p>
        {cautionItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-foreground/80">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
