import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRankedFeed } from '@/lib/pipeline'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const mode = searchParams.get('mode') ?? 'for-you'

    // Get user persona
    const { data: profile } = await supabase
      .from('profiles')
      .select('persona')
      .eq('id', user.id)
      .single()

    const persona = profile?.persona ?? 'professional'

    if (mode === 'trending') {
      // Trending: just order by recency and sentiment magnitude
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return Response.json({
        articles: (articles ?? []).map(a => ({ ...a, relevance_score: 0 })),
        offset,
        limit,
        mode,
      })
    }

    // For-you: ranked by interest graph
    const ranked = await getRankedFeed(user.id, persona, offset, limit)
    return Response.json({ articles: ranked, offset, limit, mode })
  } catch (error) {
    console.error('Feed error:', error)
    return Response.json({ error: 'Feed fetch failed' }, { status: 500 })
  }
}
