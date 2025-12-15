-- Migration: Create gauge_profiles table for veBTC gauge profile pictures and descriptions
-- Each gauge can have a profile managed only by the wallet owner of the veBTC gauge

-- Create the gauge_profiles table
CREATE TABLE IF NOT EXISTS public.gauge_profiles (
    gauge_address TEXT PRIMARY KEY,
    vebtc_token_id TEXT NOT NULL,
    owner_address TEXT NOT NULL,
    profile_picture_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on owner_address for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gauge_profiles_owner ON public.gauge_profiles(owner_address);

-- Create index on vebtc_token_id for lookups by token
CREATE INDEX IF NOT EXISTS idx_gauge_profiles_token_id ON public.gauge_profiles(vebtc_token_id);

-- Enable Row Level Security
ALTER TABLE public.gauge_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read gauge profiles
DROP POLICY IF EXISTS "Anyone can read gauge profiles" ON public.gauge_profiles;
CREATE POLICY "Anyone can read gauge profiles" ON public.gauge_profiles
    FOR SELECT USING (true);

-- Policy: Gauge owners can insert their own profiles
-- Note: Ownership verification is done at the application layer since we need
-- to verify on-chain ownership of the veBTC NFT
DROP POLICY IF EXISTS "Users can insert gauge profiles" ON public.gauge_profiles;
CREATE POLICY "Users can insert gauge profiles" ON public.gauge_profiles
    FOR INSERT WITH CHECK (true);

-- Policy: Gauge owners can update their own profiles
-- The application layer verifies that the wallet owns the veBTC NFT
DROP POLICY IF EXISTS "Users can update gauge profiles" ON public.gauge_profiles;
CREATE POLICY "Users can update gauge profiles" ON public.gauge_profiles
    FOR UPDATE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gauge_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
DROP TRIGGER IF EXISTS trigger_update_gauge_profiles_updated_at ON public.gauge_profiles;
CREATE TRIGGER trigger_update_gauge_profiles_updated_at
    BEFORE UPDATE ON public.gauge_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_gauge_profiles_updated_at();

-- Create storage bucket for profile pictures (if storage extension is available)
-- Note: This needs to be run separately in Supabase dashboard or via storage API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gauge-avatars', 'gauge-avatars', true) ON CONFLICT DO NOTHING;

