import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, ProfileUpdate } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Shield, Clock, KeyRound, User, Phone } from 'lucide-react';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [safeWord, setSafeWord] = useState('');
  const [checkinInterval, setCheckinInterval] = useState(5);
  const [safetyWeight, setSafetyWeight] = useState(0.5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setSafeWord(profile.safe_word ?? '');
      setCheckinInterval(profile.default_checkin_interval ?? 5);
      setSafetyWeight(profile.default_safety_weight ?? 0.5);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName || undefined,
      phone: phone || undefined,
      safe_word: safeWord || undefined,
      default_checkin_interval: checkinInterval,
      default_safety_weight: safetyWeight,
    });
    setSaving(false);
  };

  if (authLoading || loading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="settings-section bg-card/80 border-border/50 backdrop-blur-sm 
                         animate-fade-in-up opacity-0 stagger-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 font-display">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-5 h-5 text-primary" />
              </div>
              Profile
            </CardTitle>
            <CardDescription className="pl-12">Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input-glow transition-all duration-300 bg-input/50 
                           hover:bg-input/70 focus:bg-input"
              />
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-muted-foreground icon-hover" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="input-glow transition-all duration-300 bg-input/50 
                           hover:bg-input/70 focus:bg-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Journey Defaults */}
        <Card className="settings-section bg-card/80 border-border/50 backdrop-blur-sm 
                         animate-fade-in-up opacity-0 stagger-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 font-display">
              <div className="p-2 rounded-lg bg-fastest/10 transition-colors">
                <Clock className="w-5 h-5 text-fastest" />
              </div>
              Journey Defaults
            </CardTitle>
            <CardDescription className="pl-12">Default settings for new journeys</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4 group">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Check-in Interval</Label>
                <span className="text-sm text-primary font-medium tabular-nums 
                                 px-2 py-0.5 rounded bg-primary/10">
                  {checkinInterval} min
                </span>
              </div>
              <Slider
                value={[checkinInterval]}
                onValueChange={([val]) => setCheckinInterval(val)}
                min={2}
                max={15}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                How often we'll ask you to confirm you're safe during a journey.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Safety Preference</Label>
                <span className={`text-sm font-medium px-2 py-0.5 rounded transition-colors
                  ${safetyWeight < 0.3 
                    ? 'text-fastest bg-fastest/10' 
                    : safetyWeight > 0.7 
                      ? 'text-safe bg-safe/10' 
                      : 'text-balanced bg-balanced/10'
                  }`}>
                  {safetyWeight < 0.3 ? 'Faster' : safetyWeight > 0.7 ? 'Safer' : 'Balanced'}
                </span>
              </div>
              <Slider
                value={[safetyWeight]}
                onValueChange={([val]) => setSafetyWeight(val)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-fastest" />
                  Faster
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-safe" />
                  Safer
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Section */}
        <Card className="settings-section bg-card/80 border-border/50 backdrop-blur-sm 
                         animate-fade-in-up opacity-0 stagger-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 font-display">
              <div className="p-2 rounded-lg bg-safe/10 transition-colors">
                <Shield className="w-5 h-5 text-safe" />
              </div>
              Safety
            </CardTitle>
            <CardDescription className="pl-12">Emergency and safety settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 group">
              <Label htmlFor="safeWord" className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="w-4 h-4 text-muted-foreground icon-hover" />
                Safe Word
              </Label>
              <Input
                id="safeWord"
                type="password"
                value={safeWord}
                onChange={(e) => setSafeWord(e.target.value)}
                placeholder="Enter a secret safe word"
                className="input-glow transition-all duration-300 bg-input/50 
                           hover:bg-input/70 focus:bg-input"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                A secret word you can use to silently trigger an alert if you're in danger.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full h-12 font-display text-base animate-fade-in-up opacity-0 stagger-4
                     hover:shadow-glow-md transition-all duration-300" 
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Save Settings
        </Button>
      </main>
    </div>
  );
}
