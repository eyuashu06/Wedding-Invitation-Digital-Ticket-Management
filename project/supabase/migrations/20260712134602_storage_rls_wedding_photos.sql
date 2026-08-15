-- Storage RLS policies for wedding-photos bucket
-- Authenticated users upload to their own folder, public read for all

DROP POLICY IF EXISTS "photos_insert_own" ON storage.objects;
CREATE POLICY "photos_insert_own" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'wedding-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "photos_select_public" ON storage.objects;
CREATE POLICY "photos_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wedding-photos');

DROP POLICY IF EXISTS "photos_delete_own" ON storage.objects;
CREATE POLICY "photos_delete_own" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wedding-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "photos_update_own" ON storage.objects;
CREATE POLICY "photos_update_own" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'wedding-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
