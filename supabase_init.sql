-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE public.audios ENABLE ROW LEVEL SECURITY;

-- 2. Allow anonymous/public users to INSERT records into public.audios
CREATE POLICY "Enable insert for everyone" 
ON public.audios 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 3. Allow anonymous/public users to VIEW records in public.audios
CREATE POLICY "Enable read for everyone" 
ON public.audios 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 4. Storage Policies (for 'audios' bucket)
-- Note: You might need to create the bucket 'audios' as public in the dashboard first if it doesn't exist.

-- Allow public read access to files in 'audios' bucket
CREATE POLICY "Give public access to audios" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'audios');

-- Allow public upload access to files in 'audios' bucket
CREATE POLICY "Allow public uploads to audios" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'audios');
