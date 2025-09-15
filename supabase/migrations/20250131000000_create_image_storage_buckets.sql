-- Create storage buckets for product and part images
-- This migration creates the missing storage buckets that are referenced in the application

-- Create products_images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products_images', 'products_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create part_images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('part_images', 'part_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for products_images bucket
-- Allow authenticated users to upload, view, update and delete their own product images
CREATE POLICY "Users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'products_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products_images');

CREATE POLICY "Users can update their product images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'products_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their product images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'products_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policies for part_images bucket
-- Allow authenticated users to upload, view, update and delete their own part images
CREATE POLICY "Users can upload part images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'part_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view part images" ON storage.objects
FOR SELECT USING (bucket_id = 'part_images');

CREATE POLICY "Users can update their part images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'part_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their part images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'part_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);