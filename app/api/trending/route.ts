import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10)
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10)

    // Fetch articles from last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(200)

    if (!articles || articles.length === 0) {
      // Fallback: last 7 days if 48h window is empty (e.g. seeded data)
      const fallbackCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: fallback } = await supabase
        .from('articles')
        .select('*')
        .gte('published_at', fallbackCutoff)
        .order('published_at', { ascending: false })
        .limit(200)

      return scoreAndReturn(supabase, fallback ?? [], offset, limit)
    }

    return scoreAndReturn(supabase, articles, offset, limit)
  } catch (error) {
    console.error('Trending error:', error)
    return Response.json({ error: 'Trending fetch failed' }, { status: 500 })
  }
}

async function scoreAndReturn(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  articles: Record<string, unknown>[],
  offset: number,
  limit: number
) {
  if (articles.length === 0) return Response.json({ articles: [] })

  const articleIds = articles.map((a) => a.id as string)

  // Fetch click counts per article
  const { data: interactions } = await supabase
    .from('user_article_interactions')
    .select('article_id, interaction_type, dwell_seconds')
    .in('article_id', articleIds)

  // Aggregate: clicks and avg dwell per article
  const stats: Record<string, { clicks: number; totalDwell: number; dwellCount: number }> = {}
  for (const row of interactions ?? []) {
    const id = row.article_id as string
    if (!stats[id]) stats[id] = { clicks: 0, totalDwell: 0, dwellCount: 0 }
    if (row.interaction_type === 'click') stats[id].clicks++
    if ((row.dwell_seconds as number) > 0) {
      stats[id].totalDwell += row.dwell_seconds as number
      stats[id].dwellCount++
    }
  }

  const now = Date.now()

  // Score each article
  const scored = articles.map((a) => {
    const s = stats[a.id as string] ?? { clicks: 0, totalDwell: 0, dwellCount: 0 }
    const avgDwell = s.dwellCount > 0 ? s.totalDwell / s.dwellCount : 0
    const ageHours = (now - new Date(a.published_at as string).getTime()) / 3600000
    // Recency factor: 10 at 0h, decays to 0 at 48h
    const recencyFactor = Math.max(0, 10 - (ageHours / 48) * 10)
    const trendingScore = s.clicks * 2 + avgDwell / 10 + recencyFactor

    return { ...a, trending_score: Math.round(trendingScore * 10) / 10 }
  })

  // Sort by trending_score DESC
  scored.sort((a, b) => (b.trending_score as number) - (a.trending_score as number))

  const paginated = scored.slice(offset, offset + limit)
  return Response.json({ articles: paginated, offset, limit })
}
