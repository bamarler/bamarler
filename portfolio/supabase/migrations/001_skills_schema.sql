-- Skills Schema for Portfolio
-- Run this in Supabase SQL Editor

-- 1. Create Skill Categories Table
CREATE TABLE public.skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  display_order INT DEFAULT 0
);

-- 2. Create Skills Table (FK to categories)
CREATE TABLE public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  proficiency INT CHECK (proficiency >= 0 AND proficiency <= 100), -- Optional: for progress bars
  icon_name TEXT, -- Optional: lucide icon name (e.g., 'code', 'database')
  display_order INT DEFAULT 0
);

-- 3. Populate Skill Categories
INSERT INTO public.skill_categories (name, display_order)
VALUES
  ('Languages', 1),
  ('Frameworks & Libraries', 2),
  ('Tools & Platforms', 3),
  ('Concepts', 4);

-- 4. Populate Skills
-- Get category IDs for inserts
WITH cats AS (
  SELECT id, name FROM public.skill_categories
)
INSERT INTO public.skills (name, category_id, proficiency, icon_name, display_order)
VALUES
  -- Languages
  ('Python', (SELECT id FROM cats WHERE name = 'Languages'), 90, 'code', 1),
  ('TypeScript', (SELECT id FROM cats WHERE name = 'Languages'), 85, 'code', 2),
  ('JavaScript', (SELECT id FROM cats WHERE name = 'Languages'), 85, 'code', 3),
  ('Java', (SELECT id FROM cats WHERE name = 'Languages'), 75, 'code', 4),
  ('SQL', (SELECT id FROM cats WHERE name = 'Languages'), 80, 'database', 5),
  ('C', (SELECT id FROM cats WHERE name = 'Languages'), 70, 'cpu', 6),

  -- Frameworks & Libraries
  ('React', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 85, 'component', 1),
  ('Next.js', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 80, 'globe', 2),
  ('FastAPI', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 80, 'zap', 3),
  ('PyTorch', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 70, 'brain', 4),
  ('Pandas', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 85, 'table', 5),
  ('GSAP', (SELECT id FROM cats WHERE name = 'Frameworks & Libraries'), 75, 'sparkles', 6),

  -- Tools & Platforms
  ('Git', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 90, 'git-branch', 1),
  ('PostgreSQL', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 80, 'database', 2),
  ('Supabase', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 80, 'cloud', 3),
  ('Docker', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 70, 'container', 4),
  ('Vercel', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 85, 'triangle', 5),
  ('Linux', (SELECT id FROM cats WHERE name = 'Tools & Platforms'), 75, 'terminal', 6),

  -- Concepts
  ('Machine Learning', (SELECT id FROM cats WHERE name = 'Concepts'), 75, 'brain', 1),
  ('REST APIs', (SELECT id FROM cats WHERE name = 'Concepts'), 90, 'network', 2),
  ('Data Engineering', (SELECT id FROM cats WHERE name = 'Concepts'), 80, 'workflow', 3),
  ('Physics Simulation', (SELECT id FROM cats WHERE name = 'Concepts'), 85, 'atom', 4);

-- 5. Enable RLS and Allow Public Read
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.skill_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.skills FOR SELECT USING (true);

-- 6. Create index for faster joins
CREATE INDEX skills_category_id_idx ON public.skills(category_id);
