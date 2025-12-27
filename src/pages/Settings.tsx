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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Journey Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Journey Defaults
            </CardTitle>
            <CardDescription>Default settings for new journeys</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Check-in Interval</Label>
                <span className="text-sm text-muted-foreground">{checkinInterval} minutes</span>
              </div>
              <Slider
                value={[checkinInterval]}
                onValueChange={([val]) => setCheckinInterval(val)}
                min={2}
                max={15}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How often we'll ask you to confirm you're safe during a journey.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Safety Preference</Label>
                <span className="text-sm text-muted-foreground">
                  {safetyWeight < 0.3 ? 'Faster routes' : safetyWeight > 0.7 ? 'Safer routes' : 'Balanced'}
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
                <span>Faster</span>
                <span>Safer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-safe" />
              Safety
            </CardTitle>
            <CardDescription>Emergency and safety settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="safeWord" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Safe Word
              </Label>
              <Input
                id="safeWord"
                type="password"
                value={safeWord}
                onChange={(e) => setSafeWord(e.target.value)}
                placeholder="Enter a secret safe word"
              />
              <p className="text-xs text-muted-foreground">
                A secret word you can use to silently trigger an alert if you're in danger.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </main>
    </div>
  );
}
