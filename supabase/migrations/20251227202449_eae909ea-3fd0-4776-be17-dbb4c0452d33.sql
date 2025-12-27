-- Create table to store live location updates during journeys
CREATE TABLE public.journey_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  accuracy NUMERIC,
  speed NUMERIC,
  heading NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_locations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own location updates
CREATE POLICY "Users can insert their own locations"
ON public.journey_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own location history
CREATE POLICY "Users can view their own locations"
ON public.journey_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Create table for location sharing tokens (so contacts can view without auth)
CREATE TABLE public.location_share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_share_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can insert their own tokens"
ON public.location_share_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
ON public.location_share_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.location_share_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast token lookups
CREATE INDEX idx_location_share_tokens_token ON public.location_share_tokens(token);
CREATE INDEX idx_journey_locations_journey_id ON public.journey_locations(journey_id);

-- Enable realtime for live location tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_locations;