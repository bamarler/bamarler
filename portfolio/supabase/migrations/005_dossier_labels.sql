-- Dossier labels, for a dossier_pages table seeded before they existed
-- Run this in Supabase SQL Editor (a fresh 003 already includes all of this)
--
-- Every word inside the dossier comes from the database, including the small labels
-- that used to be written into the code (the outside of the folder stays in code). This adds them to the existing rows, leaves the
-- rest of each row's data alone, and drops the cover's tagline.
-- (See 003_dossier_pages.sql for the full list of keys each template reads.)

UPDATE public.dossier_pages
SET data = (data - 'tagline') || jsonb_build_object(
  'header', 'personnel file',
  'contents', 'contents',
  'resume_label', 'resume'
)
WHERE template = 'cover';

UPDATE public.dossier_pages
SET data = data || jsonb_build_object('header', 'subject profile', 'interests_label', 'known interests')
WHERE template = 'profile';

UPDATE public.dossier_pages
SET data = data || jsonb_build_object('header', 'work history')
WHERE template = 'experiences';

UPDATE public.dossier_pages
SET data = data || jsonb_build_object(
  'header', 'projects',
  'tools_label', 'tools',
  'live_label', 'live',
  'source_label', 'source'
)
WHERE template = 'projects';
