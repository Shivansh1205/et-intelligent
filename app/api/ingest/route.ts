import { NextRequest } from 'next/server'
import { runIngestionPipeline, RawArticle } from '@/lib/pipeline'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const articles: RawArticle[] = body.articles

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return Response.json({ error: 'No articles provided' }, { status: 400 })
    }

    const result = await runIngestionPipeline(articles)
    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error('Ingest error:', error)
    return Response.json(
      { error: 'Ingestion failed', detail: String(error) },
      { status: 500 }
    )
  }
}
