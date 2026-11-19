-- Photos for the picture frame on /desk
-- Run this in Supabase SQL Editor
--
-- The frame shows every image in the `frame/` folder of the public `assets` bucket, in
-- name order (prefix 01_, 02_, … to choose the order). Reading a public file needs no
-- policy, but listing the folder does; this allows listing that folder and nothing else.

CREATE POLICY "Allow public listing of frame photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'frame');
