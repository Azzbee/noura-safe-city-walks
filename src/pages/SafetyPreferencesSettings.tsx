import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSafetyPreferences, SafetyPreferences } from '@/hooks/useSafetyPreferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Sun, Shield, Users, Video, MapPin, Star, Navigation, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PREFERENCE_ITEMS = [
  {
    key: 'lighting' as const,
    icon: Sun,
    label: 'Well-lit paths',
    description: 'Prioritize streets with good lighting',
    color: 'hsl(45, 93%, 55%)',
  },
  {
    key: 'police_stations' as const,
    icon: Shield,
    label: 'Near police stations',
    description: 'Routes passing by police stations',
    color: 'hsl(217, 91%, 60%)',
  },
  {
    key: 'busy_areas' as const,
    icon: Users,
    label: 'Busy areas',
    description: 'Prefer streets with more pedestrian activity',
    color: 'hsl(160, 84%, 39%)',
  },
  {
    key: 'cctv_coverage' as const,
    icon: Video,
    label: 'CCTV coverage',
    description: 'Areas with surveillance cameras',
    color: 'hsl(262, 83%, 58%)',
  },
  {
    key: 'safe_landmarks' as const,
    icon: MapPin,
    label: 'Safe landmarks',
    description: 'Near hospitals, pharmacies, metro stations',
    color: 'hsl(142, 71%, 45%)',
  },
];

function StarRating({ 
  value, 
  onChange, 
  color 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  color: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className="w-6 h-6 transition-colors"
            fill={(hovered || value) >= star ? color : 'transparent'}
            stroke={(hovered || value) >= star ? color : 'hsl(var(--muted-foreground))'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function SafetyPreferencesSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { preferences, loading, savePreferences } = useSafetyPreferences();
  const [localPrefs, setLocalPrefs] = useState<SafetyPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs(preferences);
    }
  }, [preferences, localPrefs]);

  // Track changes
  useEffect(() => {
    if (localPrefs && preferences) {
      const changed = Object.keys(localPrefs).some(
        key => localPrefs[key as keyof SafetyPreferences] !== preferences[key as keyof SafetyPreferences]
      );
      setHasChanges(changed);
    }
  }, [localPrefs, preferences]);

  const handleSave = async () => {
    if (!localPrefs) return;
    setSaving(true);
    const success = await savePreferences(localPrefs as unknown as Record<string, number>);
    setSaving(false);
    if (success) {
      toast.success('Safety preferences saved');
      setHasChanges(false);
      setJustSaved(true);
    } else {
      toast.error('Failed to save preferences');
    }
  };

  const handleRecalculateRoutes = () => {
    toast.success('Routes will use your new preferences', {
      description: 'Navigate to the map to calculate new routes',
    });
    navigate('/');
  };

  const updatePref = (key: keyof SafetyPreferences, value: number) => {
    if (!localPrefs) return;
    setLocalPrefs({ ...localPrefs, [key]: value });
    setJustSaved(false);
  };

  if (authLoading || loading || !localPrefs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Safety Preferences</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Route Priority Factors</CardTitle>
            <CardDescription>
              Rate how important each safety factor is when calculating your routes.
              Higher ratings mean we'll prioritize that factor more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {PREFERENCE_ITEMS.map((item, index) => (
              <div 
                key={item.key}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 
                           animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon 
                      className="w-5 h-5" 
                      style={{ color: item.color }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <StarRating
                  value={localPrefs[item.key]}
                  onChange={(val) => updatePref(item.key, val)}
                  color={item.color}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="pt-2 space-y-3">
          <Button 
            onClick={handleSave} 
            className="w-full h-12 font-display text-base hover:shadow-glow-md transition-all duration-300" 
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {hasChanges ? 'Save Changes' : 'Preferences Saved'}
          </Button>

          {justSaved && (
            <Button 
              onClick={handleRecalculateRoutes} 
              variant="outline"
              className="w-full h-12 font-display text-base border-primary/50 hover:bg-primary/10 transition-all duration-300 animate-fade-in"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Recalculate Routes with New Preferences
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
