import { createClient } from '@supabase/supabase-js'

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || ''
// Construct the URL dynamically
const supabaseUrl = `https://${projectId}.supabase.co`
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
