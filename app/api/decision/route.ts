import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDecisionInsights } from '@/lib/decision'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { article_id, article, persona } = await request.json()
    if (!article_id || !article || !persona) {
      return Response.json({ error: 'article_id, article, and persona are required' }, { status: 400 })
    }

    // Check cache (per user + persona)
    const { data: cached } = await supabase
      .from('decision_insights')
      .select('content')
      .eq('article_id', article_id)
      .eq('user_id', user.id)
      .eq('persona', persona)
      .single()

    if (cached) return Response.json({ insights: cached.content })

    // Generate
    const insights = await generateDecisionInsights(article, persona)
    if (!insights) return Response.json({ error: 'Decision generation failed' }, { status: 500 })

    // Cache
    await supabase.from('decision_insights').insert({
      article_id,
      user_id: user.id,
      persona,
      content: insights,
    })

    return Response.json({ insights })
  } catch (error) {
    console.error('Decision error:', error)
    return Response.json({ error: 'Decision failed' }, { status: 500 })
  }
}
