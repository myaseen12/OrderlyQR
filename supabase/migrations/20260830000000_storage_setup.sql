-- 1. Create the 'menu-images' bucket for storing dish photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on storage.objects (normally enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Define Public Read Access Policy
-- Allows any guest or customer to view menu item images in the digital catalog
CREATE POLICY "Public Read Access to Menu Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- 3. Define Authenticated Upload Access Policy
-- Restricts restaurant members to only uploading files under their own restaurant_id folder path
CREATE POLICY "Restaurant Members Upload Menu Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT restaurant_id 
    FROM public.restaurant_members 
    WHERE user_id = auth.uid()
  )
);

-- 4. Define Authenticated Delete Access Policy
-- Restricts restaurant members to only deleting files under their own restaurant_id folder path
CREATE POLICY "Restaurant Members Delete Menu Images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT restaurant_id 
    FROM public.restaurant_members 
    WHERE user_id = auth.uid()
  )
);
