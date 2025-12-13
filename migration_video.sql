-- Add columns for image support
ALTER TABLE public.audios ADD COLUMN IF NOT EXISTS image_storage_path text;
ALTER TABLE public.audios ADD COLUMN IF NOT EXISTS image_public_url text;
