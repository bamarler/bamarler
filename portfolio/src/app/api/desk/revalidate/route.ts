import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { DESK_CONTENT_TAG } from '@/lib/desk/content'

// Supabase Database Webhook target: refreshes the desk's cached content when a row in
// dossier_pages, experiences, projects, skills or skill_categories changes.
// Set up in Supabase → Database → Webhooks: POST to /api/desk/revalidate with the header
// `x-desk-secret: <DESK_REVALIDATE_SECRET>`.

function authorized(req: NextRequest) {
  const secret = process.env.DESK_REVALIDATE_SECRET
  const given = req.headers.get('x-desk-secret')
  if (!secret || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  revalidateTag(DESK_CONTENT_TAG, { expire: 0 })
  return NextResponse.json({ revalidated: true })
}
