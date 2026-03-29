import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFutureScenarios } from '@/lib/simulation'
import type { BriefingResponse } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { article_id, briefing } = await request.json()
    if (!article_id || !briefing) {
      return Response.json({ error: 'article_id and briefing are required' }, { status: 400 })
    }

    // Check cache
    const { data: cached } = await supabase
      .from('article_simulations')
      .select('content')
      .eq('article_id', article_id)
      .single()

    if (cached) return Response.json({ simulation: cached.content })

    // Generate
    const simulation = await generateFutureScenarios(briefing as BriefingResponse)
    if (!simulation) return Response.json({ error: 'Simulation generation failed' }, { status: 500 })

    // Cache
    await supabase.from('article_simulations').insert({ article_id, content: simulation })

    return Response.json({ simulation })
  } catch (error) {
    console.error('Simulation error:', error)
    return Response.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
