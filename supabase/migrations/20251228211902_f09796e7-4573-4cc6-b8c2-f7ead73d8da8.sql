-- Table for geofence events history
CREATE TABLE public.geofence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.saved_locations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('entered', 'exited')),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for geofence_events
CREATE POLICY "Users can view their own geofence events"
ON public.geofence_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own geofence events"
ON public.geofence_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own geofence events"
ON public.geofence_events FOR DELETE
USING (auth.uid() = user_id);

-- Junction table for per-contact geofence rules
CREATE TABLE public.contact_zone_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.saved_locations(id) ON DELETE CASCADE,
  notify_on_enter BOOLEAN NOT NULL DEFAULT true,
  notify_on_exit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, location_id)
);

-- Enable RLS
ALTER TABLE public.contact_zone_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_zone_rules
CREATE POLICY "Users can view their own contact zone rules"
ON public.contact_zone_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact zone rules"
ON public.contact_zone_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact zone rules"
ON public.contact_zone_rules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact zone rules"
ON public.contact_zone_rules FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_geofence_events_user_location ON public.geofence_events(user_id, location_id);
CREATE INDEX idx_geofence_events_created ON public.geofence_events(created_at DESC);
CREATE INDEX idx_contact_zone_rules_user ON public.contact_zone_rules(user_id);
CREATE INDEX idx_contact_zone_rules_location ON public.contact_zone_rules(location_id);