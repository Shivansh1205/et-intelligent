import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBriefing, answerFollowUp, BriefingResponse } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { article_id, follow_up_question, briefing_context } = body

    // Follow-up answer mode: stream response
    if (follow_up_question && briefing_context) {
      const stream = await answerFollowUp(briefing_context as BriefingResponse, follow_up_question)
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Generate briefing mode
    if (!article_id) {
      return Response.json({ error: 'article_id is required' }, { status: 400 })
    }

    // Fetch the article and related articles
    const { data: article } = await supabase
      .from('articles')
      .select('*')
      .eq('id', article_id)
      .single()

    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 })
    }

    const entities = article.entities as Record<string, string[]> ?? {}
    const companies = entities.companies ?? []

    // Find related articles by shared companies or topics
    let relatedArticles: typeof article[] = []
    if (companies.length > 0) {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .neq('id', article_id)
        .order('published_at', { ascending: false })
        .limit(5)

      relatedArticles = data ?? []
    }

    const articleGroup = [article, ...relatedArticles].map(a => ({
      title: a.title,
      summary: a.summary ?? '',
      published_at: a.published_at,
    }))

    const briefing = await generateBriefing(articleGroup)

    if (!briefing) {
      return Response.json({ error: 'Briefing generation failed' }, { status: 500 })
    }

    return Response.json({ briefing, article, related: relatedArticles })
  } catch (error) {
    console.error('Briefing error:', error)
    return Response.json({ error: 'Briefing failed' }, { status: 500 })
  }
}
