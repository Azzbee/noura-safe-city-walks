import { Card } from '@/components/ui/card';
import { Shield, Sun, Users, Train, Building2 } from 'lucide-react';

export default function SafetyLegend() {
  const items = [
    { icon: Sun, color: 'hsl(45, 93%, 47%)', label: 'Well-lit areas' },
    { icon: Users, color: 'hsl(142, 76%, 36%)', label: 'Busy streets' },
    { icon: Shield, color: 'hsl(217, 91%, 60%)', label: 'Police stations' },
    { icon: Building2, color: 'hsl(0, 84%, 60%)', label: 'Hospitals' },
    { icon: Train, color: 'hsl(270, 70%, 60%)', label: 'Metro stations' },
  ];

  return (
    <Card className="bg-card/90 backdrop-blur border-border p-3">
      <h4 className="text-xs font-medium mb-2 text-muted-foreground">Safety Legend</h4>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-foreground/80">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
