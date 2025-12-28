import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useContactZoneRules } from '@/hooks/useContactZoneRules';
import { useGeofencing } from '@/hooks/useGeofencing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, MapPin, Plus, Trash2, Bell, BellOff, Radar, Users, History, TestTube, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeofenceLocation {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  label: string;
  geofence_enabled: boolean;
  geofence_radius_m: number;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
}

export default function GeofenceSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useSavedLocations();
  const { contacts } = useEmergencyContacts();
  const { rules, upsertRule, deleteRule, getRulesForLocation } = useContactZoneRules();
  const { simulateGeofenceEvent } = useGeofencing({ userLat: null, userLng: null, enabled: false });
  
  const [locations, setLocations] = useState<GeofenceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [contactsDialogOpen, setContactsDialogOpen] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState<string | null>(null);
  
  // New location form state
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('saved');
  const [newRadius, setNewRadius] = useState(200);
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchLocations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setLocations(data.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        lat: Number(loc.lat),
        lng: Number(loc.lng),
        label: loc.label || 'saved',
        geofence_enabled: loc.geofence_enabled ?? false,
        geofence_radius_m: loc.geofence_radius_m ?? 200,
        notify_on_enter: loc.notify_on_enter ?? true,
        notify_on_exit: loc.notify_on_exit ?? true,
      })));
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user]);

  const updateLocation = async (id: string, updates: Partial<GeofenceLocation>) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('saved_locations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.map(loc => 
        loc.id === id ? { ...loc, ...updates } : loc
      ));
      
      toast({ title: 'Settings saved' });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      toast({ title: 'Location deleted' });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleAddLocation = async () => {
    if (!newName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setAddingLocation(true);
    try {
      // Geocode the address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}&limit=1`
      );
      const results = await response.json();
      
      if (results.length === 0) {
        toast({ title: 'Could not find address', variant: 'destructive' });
        setAddingLocation(false);
        return;
      }

      const { lat, lon } = results[0];
      
      // Save location with geofencing enabled
      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          user_id: user!.id,
          name: newName,
          label: newLabel,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: newAddress,
          geofence_enabled: true,
          geofence_radius_m: newRadius,
          notify_on_enter: true,
          notify_on_exit: true,
        })
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [...prev, {
        id: data.id,
        name: data.name,
        address: data.address,
        lat: Number(data.lat),
        lng: Number(data.lng),
        label: data.label || 'saved',
        geofence_enabled: data.geofence_enabled ?? true,
        geofence_radius_m: data.geofence_radius_m ?? 200,
        notify_on_enter: data.notify_on_enter ?? true,
        notify_on_exit: data.notify_on_exit ?? true,
      }]);

      setNewName('');
      setNewAddress('');
      setNewLabel('saved');
      setNewRadius(200);
      setAddDialogOpen(false);
      refresh();
      
      toast({ title: 'Geofenced location added' });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({ title: 'Failed to add location', variant: 'destructive' });
    } finally {
      setAddingLocation(false);
    }
  };

  const handleContactRuleToggle = async (
    locationId: string,
    contactId: string,
    field: 'notify_on_enter' | 'notify_on_exit',
    currentValue: boolean
  ) => {
    const existingRule = getRulesForLocation(locationId).find(r => r.contact_id === contactId);
    
    await upsertRule(
      contactId,
      locationId,
      field === 'notify_on_enter' ? !currentValue : (existingRule?.notify_on_enter ?? true),
      field === 'notify_on_exit' ? !currentValue : (existingRule?.notify_on_exit ?? true)
    );
  };

  const handleTestEvent = async (locationId: string, eventType: 'entered' | 'exited') => {
    await simulateGeofenceEvent(locationId, eventType);
    setTestDialogOpen(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'home': return '🏠';
      case 'work': return '💼';
      default: return '📍';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Safe Zones</h1>
              <p className="text-sm text-muted-foreground">Geofencing & auto-notifications</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/geofence-history')}>
            <History className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Radar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                When geofencing is enabled, your emergency contacts will be automatically 
                notified when you enter or leave these locations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Locations List */}
        {locations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No saved locations yet</p>
              <p className="text-sm text-muted-foreground/70">Add a location to set up geofencing</p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location, index) => (
            <Card 
              key={location.id}
              className={`animate-fade-in-up opacity-0 transition-all ${
                location.geofence_enabled ? 'border-primary/30 bg-primary/5' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getLabelIcon(location.label)}</span>
                    <div>
                      <CardTitle className="text-base">{location.name}</CardTitle>
                      {location.address && (
                        <CardDescription className="text-xs line-clamp-1">
                          {location.address}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={location.geofence_enabled}
                      onCheckedChange={(checked) => 
                        updateLocation(location.id, { geofence_enabled: checked })
                      }
                      disabled={saving === location.id}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteLocation(location.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {location.geofence_enabled && (
                <CardContent className="pt-0 space-y-4">
                  {/* Radius Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Detection Radius</Label>
                      <span className="text-sm text-primary font-medium tabular-nums">
                        {location.geofence_radius_m}m
                      </span>
                    </div>
                    <Slider
                      value={[location.geofence_radius_m]}
                      onValueChange={([val]) => 
                        updateLocation(location.id, { geofence_radius_m: val })
                      }
                      min={50}
                      max={1000}
                      step={50}
                      disabled={saving === location.id}
                    />
                  </div>

                  {/* Notification Toggles */}
                  <div className="flex gap-4">
                    <button
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        location.notify_on_enter 
                          ? 'bg-safe/10 border-safe/30 text-safe' 
                          : 'bg-muted/50 border-border text-muted-foreground'
                      }`}
                      onClick={() => 
                        updateLocation(location.id, { notify_on_enter: !location.notify_on_enter })
                      }
                      disabled={saving === location.id}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {location.notify_on_enter ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">On Enter</span>
                      </div>
                    </button>

                    <button
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        location.notify_on_exit 
                          ? 'bg-danger/10 border-danger/30 text-danger' 
                          : 'bg-muted/50 border-border text-muted-foreground'
                      }`}
                      onClick={() => 
                        updateLocation(location.id, { notify_on_exit: !location.notify_on_exit })
                      }
                      disabled={saving === location.id}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {location.notify_on_exit ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">On Exit</span>
                      </div>
                    </button>
                  </div>

                  {/* Per-Contact Rules & Test Mode */}
                  <div className="flex gap-2 pt-2">
                    {/* Per-Contact Rules Dialog */}
                    <Dialog open={contactsDialogOpen === location.id} onOpenChange={(open) => setContactsDialogOpen(open ? location.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Users className="w-4 h-4 mr-2" />
                          Contact Rules
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Rules for {location.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          {contacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No emergency contacts configured
                            </p>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Choose which contacts get notified for this zone. If none are selected, all contacts will be notified.
                              </p>
                              {contacts.map((contact) => {
                                const rule = getRulesForLocation(location.id).find(r => r.contact_id === contact.id);
                                const hasRule = !!rule;
                                
                                return (
                                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                                        {contact.name.charAt(0)}
                                      </div>
                                      <span className="font-medium">{contact.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                          checked={hasRule ? rule.notify_on_enter : false}
                                          onCheckedChange={() => handleContactRuleToggle(location.id, contact.id, 'notify_on_enter', hasRule ? rule.notify_on_enter : false)}
                                        />
                                        <LogIn className="w-3 h-3" />
                                      </label>
                                      <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                          checked={hasRule ? rule.notify_on_exit : false}
                                          onCheckedChange={() => handleContactRuleToggle(location.id, contact.id, 'notify_on_exit', hasRule ? rule.notify_on_exit : false)}
                                        />
                                        <LogOut className="w-3 h-3" />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Test Mode Dialog */}
                    <Dialog open={testDialogOpen === location.id} onOpenChange={(open) => setTestDialogOpen(open ? location.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <TestTube className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Test Geofence for {location.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">
                            Simulate entering or leaving this zone to test your notifications without physically moving.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              className="flex-1 bg-safe hover:bg-safe/90"
                              onClick={() => handleTestEvent(location.id, 'entered')}
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              Simulate Enter
                            </Button>
                            <Button
                              className="flex-1 bg-danger hover:bg-danger/90"
                              onClick={() => handleTestEvent(location.id, 'exited')}
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Simulate Exit
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}

        {/* Add Location Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Geofenced Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Safe Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Mom's House"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Paris"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newLabel} onValueChange={setNewLabel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Home</SelectItem>
                    <SelectItem value="work">💼 Work</SelectItem>
                    <SelectItem value="saved">📍 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Detection Radius</Label>
                  <span className="text-sm text-primary font-medium">{newRadius}m</span>
                </div>
                <Slider
                  value={[newRadius]}
                  onValueChange={([val]) => setNewRadius(val)}
                  min={50}
                  max={1000}
                  step={50}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleAddLocation}
                disabled={addingLocation || !newName.trim() || !newAddress.trim()}
              >
                {addingLocation ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
