import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectContradictions } from '@/lib/contradiction'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { article_id, articles } = await request.json()
    if (!article_id || !articles?.length) {
      return Response.json({ error: 'article_id and articles are required' }, { status: 400 })
    }

    // Check cache
    const { data: cached } = await supabase
      .from('article_contradictions')
      .select('content')
      .eq('article_id', article_id)
      .single()

    if (cached) return Response.json({ contradiction: cached.content })

    // Need at least 2 articles to detect contradictions
    if (articles.length < 2) {
      const result = { contradiction: false, summary: '', viewpoints: [] }
      return Response.json({ contradiction: result })
    }

    // Generate
    const result = await detectContradictions(articles)
    if (!result) return Response.json({ error: 'Contradiction detection failed' }, { status: 500 })

    // Cache
    await supabase.from('article_contradictions').insert({ article_id, content: result })

    return Response.json({ contradiction: result })
  } catch (error) {
    console.error('Contradiction error:', error)
    return Response.json({ error: 'Contradiction detection failed' }, { status: 500 })
  }
}
