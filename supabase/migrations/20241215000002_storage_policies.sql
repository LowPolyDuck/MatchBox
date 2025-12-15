-- Migration: Create storage bucket and policies for gauge avatars
-- Run this in the Supabase SQL Editor

-- Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gauge-avatars',
    'gauge-avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Policy: Anyone can view images (public bucket)
DROP POLICY IF EXISTS "Public read access for gauge avatars" ON storage.objects;
CREATE POLICY "Public read access for gauge avatars" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'gauge-avatars');

-- Policy: Anyone can upload images (we verify ownership at the application layer)
DROP POLICY IF EXISTS "Anyone can upload gauge avatars" ON storage.objects;
CREATE POLICY "Anyone can upload gauge avatars" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'gauge-avatars');

-- Policy: Anyone can update their uploaded images
DROP POLICY IF EXISTS "Anyone can update gauge avatars" ON storage.objects;
CREATE POLICY "Anyone can update gauge avatars" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'gauge-avatars');

-- Policy: Anyone can delete images
DROP POLICY IF EXISTS "Anyone can delete gauge avatars" ON storage.objects;
CREATE POLICY "Anyone can delete gauge avatars" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'gauge-avatars');

