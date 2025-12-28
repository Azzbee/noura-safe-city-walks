-- Add safety_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS safety_preferences JSONB DEFAULT NULL;