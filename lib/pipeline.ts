import { createServiceClient } from './supabase/server'
import { extractEntities, tagSentiment } from './claude'

export interface RawArticle {
  title: string
  url: string
  summary: string
  full_text: string
  image_url?: string
  published_at: string
}

export interface PipelineResult {
  inserted: number
  skipped: number
  duration_ms: number
  entity_calls: number
  sentiment_calls: number
}

export async function runIngestionPipeline(rawArticles: RawArticle[]): Promise<PipelineResult> {
  const supabase = createServiceClient()
  const start = Date.now()
  let inserted = 0, skipped = 0, entity_calls = 0, sentiment_calls = 0

  for (const raw of rawArticles) {
    // Check duplicate
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', raw.url)
      .single()

    if (existing) { skipped++; continue }

    // Step 1: Entity extraction
    const entities = await extractEntities(raw.title, raw.full_text || raw.summary)
    entity_calls++

    // Step 2: Sentiment tagging
    const sentiment = await tagSentiment(raw.title, raw.summary)
    sentiment_calls++

    const { error } = await supabase.from('articles').insert({
      title: raw.title,
      source_url: raw.url,
      summary: raw.summary,
      full_text: raw.full_text,
      image_url: raw.image_url,
      entities: entities ?? {},
      topic_tags: entities?.topics ?? [],
      sentiment_score: sentiment?.score ?? 0,
      published_at: raw.published_at,
    })

    if (!error) inserted++
  }

  const duration_ms = Date.now() - start

  // Log pipeline run
  await supabase.from('pipeline_logs').insert({
    articles_processed: rawArticles.length,
    entity_calls,
    sentiment_calls,
    duration_ms,
    status: 'completed',
  })

  return { inserted, skipped, duration_ms, entity_calls, sentiment_calls }
}

export async function getRankedFeed(userId: string, persona: string, offset = 0, limit = 20) {
  const supabase = createServiceClient()

  // Fetch user's interest graph and explicit interests
  const [{ data: graph }, { data: interests }, { data: articles }] = await Promise.all([
    supabase.from('interest_graph').select('*').eq('user_id', userId),
    supabase.from('user_interests').select('*').eq('user_id', userId),
    supabase.from('articles')
      .select('*')
      .gte('published_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(100),
  ])

  if (!articles?.length) return []

  const graphMap = new Map<string, number>()
  for (const g of graph ?? []) {
    graphMap.set(`${g.entity_type}:${g.entity_value}`, g.score)
  }

  const interestMap = new Map<string, number>()
  for (const i of interests ?? []) {
    interestMap.set(`${i.interest_type}:${i.interest_value}`, i.weight)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = articles.map((article: any) => {
    const entities = article.entities as Record<string, string[]> ?? {}
    let base_score = 0

    for (const company of entities.companies ?? []) {
      base_score += (graphMap.get(`company:${company}`) ?? 0) * 2
      base_score += (interestMap.get(`company:${company}`) ?? 0) * 3
    }
    for (const sector of entities.sectors ?? []) {
      base_score += (graphMap.get(`sector:${sector}`) ?? 0) * 1.5
      base_score += (interestMap.get(`sector:${sector}`) ?? 0) * 2
    }
    for (const topic of article.topic_tags ?? []) {
      base_score += (graphMap.get(`topic:${topic}`) ?? 0) * 1
      base_score += (interestMap.get(`topic:${topic}`) ?? 0) * 1.5
    }

    const sentiment_bonus = persona === 'investor' ? (article.sentiment_score ?? 0) * 0.1 : 0
    return { ...article, relevance_score: base_score + sentiment_bonus }
  })

  scored.sort((a: { relevance_score: number }, b: { relevance_score: number }) => b.relevance_score - a.relevance_score)
  return scored.slice(offset, offset + limit)
}
