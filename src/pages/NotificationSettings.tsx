import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Volume2, 
  Vibrate,
  Shield,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useEffect } from 'react';

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  const { settings, updateSettings, resetSettings } = useNotificationSettings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getPermissionBadge = () => {
    if (!isSupported) {
      return <Badge variant="secondary" className="text-xs">Not Supported</Badge>;
    }
    if (permission === 'granted') {
      return <Badge className="text-xs bg-safe/20 text-safe border-safe/30">Enabled</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive" className="text-xs">Blocked</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Not Set</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Notification Settings</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Push Notification Status */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 font-display">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                Push Notifications
              </CardTitle>
              {getPermissionBadge()}
            </div>
            <CardDescription className="pl-12">
              Receive alerts even when the app is closed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSupported ? (
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser.
              </p>
            ) : isSubscribed ? (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={unsubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BellOff className="w-4 h-4 mr-2" />
                )}
                Disable Push Notifications
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={subscribe}
                disabled={isLoading || permission === 'denied'}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                Enable Push Notifications
              </Button>
            )}
            {permission === 'denied' && (
              <p className="text-xs text-destructive mt-2">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alert Types */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 font-display">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              Alert Types
            </CardTitle>
            <CardDescription className="pl-12">
              Choose which alerts you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Crime Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Real-time crime news from NewsAPI
                </p>
              </div>
              <Switch
                checked={settings.crimeAlerts}
                onCheckedChange={(checked) => updateSettings({ crimeAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  Danger Zone Entry
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alerts when you enter a danger zone
                </p>
              </div>
              <Switch
                checked={settings.dangerZoneEntry}
                onCheckedChange={(checked) => updateSettings({ dangerZoneEntry: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Approaching Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Warn when approaching danger zones
                </p>
              </div>
              <Switch
                checked={settings.approachingAlerts}
                onCheckedChange={(checked) => updateSettings({ approachingAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-safe" />
                  Community Reports
                </Label>
                <p className="text-xs text-muted-foreground">
                  New safety reports from other users
                </p>
              </div>
              <Switch
                checked={settings.safetyReports}
                onCheckedChange={(checked) => updateSettings({ safetyReports: checked })}
              />
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">High Severity Only</Label>
                  <p className="text-xs text-muted-foreground">
                    Only receive critical alerts
                  </p>
                </div>
                <Switch
                  checked={settings.highSeverityOnly}
                  onCheckedChange={(checked) => updateSettings({ highSeverityOnly: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Style */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 font-display">
              <div className="p-2 rounded-lg bg-primary/10">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              Notification Style
            </CardTitle>
            <CardDescription className="pl-12">
              Configure how alerts are delivered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  Sound
                </Label>
                <p className="text-xs text-muted-foreground">
                  Play sound for notifications
                </p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-muted-foreground" />
                  Vibration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vibrate for notifications
                </p>
              </div>
              <Switch
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSettings({ vibrationEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          className="w-full animate-fade-in-up opacity-0 stagger-4"
          onClick={resetSettings}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </main>
    </div>
  );
}
