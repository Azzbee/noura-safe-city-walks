-- Safe places table for police stations, hospitals, 24h stores, metro stations
CREATE TABLE public.safe_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('police', 'hospital', 'pharmacy_24h', 'metro', 'store_24h', 'fire_station')),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  address TEXT,
  phone TEXT,
  opening_hours JSONB,
  verified BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'osm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS - anyone can view safe places (public safety data)
ALTER TABLE public.safe_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view safe places" 
ON public.safe_places 
FOR SELECT 
USING (true);

-- Add battery monitoring settings to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS enable_battery_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS battery_warning_threshold INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS battery_critical_threshold INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS auto_notify_on_critical_battery BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS fake_call_caller_name TEXT DEFAULT 'Mom',
  ADD COLUMN IF NOT EXISTS shake_action TEXT DEFAULT 'sos' CHECK (shake_action IN ('sos', 'fake_call', 'none'));

-- Update trigger for safe_places
CREATE TRIGGER update_safe_places_updated_at
BEFORE UPDATE ON public.safe_places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();