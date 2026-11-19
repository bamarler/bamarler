-- Dossier pages for /desk
-- Run this in Supabase SQL Editor
--
-- The dossier on the desk is built from this table, in display_order:
--   cover, profile, contact, freeform  → one sheet each, with the text in `data`
--                                         (cover and contact can carry contact details:
--                                         location, email, resume, links)
--   experiences, projects, skills       → a whole section generated from those tables
--                                         (one sheet per row; skills on one sheet)
-- `tab` is the label on the divider tab that starts the section (null = no tab).
-- Only published rows are readable by the public.

CREATE TABLE public.dossier_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  template TEXT NOT NULL CHECK (
    template IN ('cover', 'profile', 'experiences', 'projects', 'skills', 'contact', 'freeform')
  ),
  tab TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.dossier_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of published pages" ON public.dossier_pages
  FOR SELECT USING (published);

CREATE INDEX dossier_pages_order_idx ON public.dossier_pages(display_order);

-- Every word on the dossier comes from here (and from the experiences/projects tables);
-- nothing is written into the code, and a key left out just isn't shown. `body` fields
-- are Markdown (paragraphs, **bold**, *italic*, [links](https://…)). Photos are file names
-- in the `assets` storage bucket.
--
-- Keys, by template:
--   any        header (small heading across the top of the sheet)
--   cover      name, tagline, photo, location, email, resume, resume_label,
--              links [{label, url}] (GitHub/LinkedIn get their logos),
--              contents (title of the contents card)
--              (the outside of the folder, its name label and stamp, is fixed in code)
--   profile    title, body, photo, interests [..], interests_label
--   projects   tools_label, live_label, source_label (link text; else the site's name)
--   contact    title, body, plus the cover's contact keys
--   freeform   title, body, photo
INSERT INTO public.dossier_pages (display_order, template, tab, data)
VALUES
  (1, 'cover', NULL, jsonb_build_object(
    'name', 'Benjamin Marler',
    'header', 'personnel file',
    'contents', 'contents',
    'photo', 'profile_picture.jpg',
    'location', 'Boston, MA',
    'email', 'marler.b@northeastern.edu',
    'resume', 'https://bamarler.com/resume',
    'resume_label', 'resume',
    'links', jsonb_build_array(
      jsonb_build_object('label', 'LinkedIn', 'url', 'https://linkedin.com/in/benjamin-marler'),
      jsonb_build_object('label', 'GitHub', 'url', 'https://github.com/bamarler')
    )
  )),
  (2, 'profile', 'about', jsonb_build_object(
    'header', 'subject profile',
    'interests_label', 'known interests',
    'title', 'About me',
    'body', E'I''m a Senior studying **Computer Science** and **Physics** with a minor in **Mathematics** at Northeastern University. My passion lies in building intelligent systems that can understand and interact with the world around them.\n\nWhen I''m away from the keyboard, you''ll find me competing on the **Ultimate Frisbee** field, traveling to new places, exploring the outdoors, or sitting on my couch watching a new movie!',
    'interests', jsonb_build_array('Ultimate Frisbee', 'Travel', 'Backpacking', 'Movies', 'Racket Sports'),
    'photo', 'about_me_fun.jpg'
  )),
  (3, 'experiences', 'work', jsonb_build_object('header', 'work history')),
  (4, 'projects', 'projects', jsonb_build_object(
    'header', 'projects',
    'tools_label', 'tools',
    'live_label', 'live',
    'source_label', 'source'
  ));
