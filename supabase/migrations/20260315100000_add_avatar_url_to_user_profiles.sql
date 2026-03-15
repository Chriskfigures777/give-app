-- Add avatar_url column to user_profiles for custom profile photos
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage policy: allow any authenticated user to upload their own avatar
-- Path pattern: user-avatars/{userId}/...
INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-avatars', 'user-avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
