import { createServiceClient } from './supabase/server'

interface EngagementEvent {
  user_id: string
  article_id: string
  interaction_type: 'click' | 'read' | 'skip' | 'share'
  dwell_seconds?: number
  scroll_depth?: number
}

function getDelta(interaction_type: string, dwell_seconds: number): number {
  if (interaction_type === 'click') return 0.1
  if (interaction_type === 'read' && dwell_seconds >= 60) return 0.3
  if (interaction_type === 'read' && dwell_seconds >= 30) return 0.15
  if (interaction_type === 'skip') return -0.05
  return 0
}

export async function processEngagement(event: EngagementEvent) {
  const supabase = createServiceClient()
  const delta = getDelta(event.interaction_type, event.dwell_seconds ?? 0)
  if (delta === 0) return

  // Get article entities
  const { data: article } = await supabase
    .from('articles')
    .select('entities, topic_tags')
    .eq('id', event.article_id)
    .single()

  if (!article) return

  // Record interaction
  await supabase.from('user_article_interactions').insert({
    user_id: event.user_id,
    article_id: event.article_id,
    interaction_type: event.interaction_type,
    dwell_seconds: event.dwell_seconds ?? 0,
    scroll_depth: event.scroll_depth ?? 0,
  })

  const entities = article.entities as Record<string, string[]> ?? {}
  const upserts: Array<{ user_id: string; entity_type: string; entity_value: string; score: number; last_updated: string }> = []

  const addEntities = (type: string, values: string[]) => {
    for (const val of values ?? []) {
      upserts.push({ user_id: event.user_id, entity_type: type, entity_value: val, score: delta, last_updated: new Date().toISOString() })
    }
  }

  addEntities('company', entities.companies)
  addEntities('sector', entities.sectors)
  addEntities('topic', article.topic_tags ?? [])
  addEntities('person', entities.people)

  for (const row of upserts) {
    const { data: existing } = await supabase
      .from('interest_graph')
      .select('score')
      .eq('user_id', row.user_id)
      .eq('entity_type', row.entity_type)
      .eq('entity_value', row.entity_value)
      .single()

    const newScore = Math.min(5.0, Math.max(-2.0, (existing?.score ?? 0) + delta))
    await supabase.from('interest_graph').upsert(
      { ...row, score: newScore },
      { onConflict: 'user_id,entity_type,entity_value' }
    )
  }
}

export async function processBookmark(user_id: string, article_id: string) {
  const supabase = createServiceClient()
  const delta = 0.5

  const { data: article } = await supabase
    .from('articles')
    .select('entities, topic_tags')
    .eq('id', article_id)
    .single()

  if (!article) return

  const entities = article.entities as Record<string, string[]> ?? {}
  const allEntities = [
    ...((entities.companies ?? []).map((v: string) => ({ type: 'company', value: v }))),
    ...((entities.sectors ?? []).map((v: string) => ({ type: 'sector', value: v }))),
    ...((article.topic_tags ?? []).map((v: string) => ({ type: 'topic', value: v }))),
  ]

  for (const { type, value } of allEntities) {
    const { data: existing } = await supabase
      .from('interest_graph')
      .select('score')
      .eq('user_id', user_id)
      .eq('entity_type', type)
      .eq('entity_value', value)
      .single()

    const newScore = Math.min(5.0, Math.max(-2.0, (existing?.score ?? 0) + delta))
    await supabase.from('interest_graph').upsert(
      { user_id, entity_type: type, entity_value: value, score: newScore, last_updated: new Date().toISOString() },
      { onConflict: 'user_id,entity_type,entity_value' }
    )
  }
}
