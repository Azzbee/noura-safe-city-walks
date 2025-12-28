-- Add geofencing columns to saved_locations
ALTER TABLE public.saved_locations 
ADD COLUMN IF NOT EXISTS geofence_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS geofence_radius_m integer DEFAULT 200,
ADD COLUMN IF NOT EXISTS notify_on_enter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_exit boolean DEFAULT true;

-- Create index for geofence-enabled locations
CREATE INDEX IF NOT EXISTS idx_saved_locations_geofence 
ON public.saved_locations(user_id) 
WHERE geofence_enabled = true;