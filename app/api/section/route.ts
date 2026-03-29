import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Sector/tag filters per section
const SECTION_FILTERS: Record<string, { sectors: string[]; tags: string[] }> = {
  markets: {
    sectors: ['banking', 'markets', 'fintech', 'energy'],
    tags: ['markets', 'banking', 'stocks', 'ipo', 'rbi'],
  },
  startups: {
    sectors: ['startup-funding', 'ecommerce', 'edtech', 'healthtech', 'consumer', 'media', 'telecom'],
    tags: ['startup', 'funding', 'ipo', 'acquisition', 'venture'],
  },
  policy: {
    sectors: ['policy', 'real-estate', 'manufacturing', 'energy'],
    tags: ['policy', 'regulation', 'rbi', 'sebi', 'government', 'budget'],
  },
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const section = request.nextUrl.searchParams.get('section') ?? ''
    const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10)
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10)

    // Bookmarks: join bookmarks → articles
    if (section === 'bookmarks') {
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('article_id, created_at, articles(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const articles = (bookmarks ?? [])
        .map((b) => b.articles)
        .filter(Boolean)

      return Response.json({ articles, section })
    }

    const filter = SECTION_FILTERS[section]
    if (!filter) return Response.json({ error: 'Unknown section' }, { status: 400 })

    // Fetch all recent articles and filter client-side on jsonb entities
    // (Supabase free tier doesn't support complex jsonb array containment in one query easily)
    const { data: all } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(200) // fetch a wide pool then filter

    const articles = (all ?? []).filter((a) => {
      const sectors: string[] = a.entities?.sectors ?? []
      const tags: string[] = a.topic_tags ?? []
      const matchesSector = sectors.some((s) =>
        filter.sectors.some((f) => s.toLowerCase().includes(f.toLowerCase()))
      )
      const matchesTag = tags.some((t) =>
        filter.tags.some((f) => t.toLowerCase().includes(f.toLowerCase()))
      )
      return matchesSector || matchesTag
    })

    const paginated = articles.slice(offset, offset + limit)
    return Response.json({ articles: paginated, section, total: articles.length })
  } catch (error) {
    console.error('Section fetch error:', error)
    return Response.json({ error: 'Section fetch failed' }, { status: 500 })
  }
}
