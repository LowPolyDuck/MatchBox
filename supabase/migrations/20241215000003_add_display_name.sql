-- Migration: Add display_name column to gauge_profiles table
-- Allows gauge owners to customize their gauge's display name

ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.gauge_profiles.display_name IS 'Custom display name for the gauge, set by the owner';

