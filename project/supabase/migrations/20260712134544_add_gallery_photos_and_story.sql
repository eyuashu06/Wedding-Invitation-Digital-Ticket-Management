/*
# Add gallery photos table and story/about field to weddings

1. New Tables
   - `wedding_photos`: stores per-wedding gallery photos uploaded to Supabase Storage
     - `id` (uuid, primary key)
     - `wedding_id` (uuid, FK → weddings.id, cascade delete)
     - `organizer_id` (uuid, FK → auth.users.id, for RLS, defaults to auth.uid())
     - `storage_path` (text): the path inside the storage bucket
     - `url` (text): public URL of the photo
     - `caption` (text, nullable)
     - `sort_order` (int4, default 0): controls display order
     - `created_at` (timestamptz)

2. Modified Tables
   - `weddings`: add `story` (text, nullable) for the About Us / couple story section

3. Security
   - Enable RLS on `wedding_photos`
   - Authenticated organizer-scoped CRUD via organizer_id
   - Anon can SELECT photos (for public guest invitation page)

4. Notes
   - The actual file upload uses Supabase Storage bucket "wedding-photos" (created separately)
   - `url` is stored at insert time so the guest page never needs to re-derive it
*/

-- Add story column to weddings if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'story' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.weddings ADD COLUMN story text;
  END IF;
END $$;

-- Create wedding_photos table
CREATE TABLE IF NOT EXISTS public.wedding_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  organizer_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  url           text NOT NULL,
  caption       text,
  sort_order    int4 NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

-- Organizer CRUD
DROP POLICY IF EXISTS "select_own_photos" ON public.wedding_photos;
CREATE POLICY "select_own_photos" ON public.wedding_photos FOR SELECT
  TO authenticated USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "insert_own_photos" ON public.wedding_photos;
CREATE POLICY "insert_own_photos" ON public.wedding_photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "update_own_photos" ON public.wedding_photos;
CREATE POLICY "update_own_photos" ON public.wedding_photos FOR UPDATE
  TO authenticated USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "delete_own_photos" ON public.wedding_photos;
CREATE POLICY "delete_own_photos" ON public.wedding_photos FOR DELETE
  TO authenticated USING (auth.uid() = organizer_id);

-- Guests (anon) can read photos on the public invitation page
DROP POLICY IF EXISTS "anon_select_wedding_photos" ON public.wedding_photos;
CREATE POLICY "anon_select_wedding_photos" ON public.wedding_photos FOR SELECT
  TO anon USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id)
  );
