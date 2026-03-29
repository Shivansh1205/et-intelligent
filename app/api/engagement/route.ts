import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processEngagement, processBookmark } from '@/lib/scoring'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, article_id, interaction_type, dwell_seconds, scroll_depth } = body

    if (!article_id) {
      return Response.json({ error: 'article_id is required' }, { status: 400 })
    }

    if (type === 'bookmark') {
      await processBookmark(user.id, article_id)
      // Also insert into bookmarks table
      await supabase.from('bookmarks').upsert(
        { user_id: user.id, article_id },
        { onConflict: 'user_id,article_id' }
      )
      return Response.json({ success: true, type: 'bookmark' })
    }

    if (type === 'engagement') {
      await processEngagement({
        user_id: user.id,
        article_id,
        interaction_type: interaction_type ?? 'click',
        dwell_seconds: dwell_seconds ?? 0,
        scroll_depth: scroll_depth ?? 0,
      })
      return Response.json({ success: true, type: 'engagement' })
    }

    return Response.json({ error: 'Invalid type. Use "engagement" or "bookmark".' }, { status: 400 })
  } catch (error) {
    console.error('Engagement error:', error)
    return Response.json({ error: 'Engagement processing failed' }, { status: 500 })
  }
}
