import { type NextRequest } from 'next/server'
import { seedArticles } from '@/lib/seed-articles'
import { runIngestionPipeline } from '@/lib/pipeline'

export async function POST(request: NextRequest) {
  try {
    const result = await runIngestionPipeline(seedArticles)
    return Response.json({
      success: true,
      message: `Seeded ${result.inserted} articles (${result.skipped} skipped)`,
      ...result,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return Response.json(
      { error: 'Seeding failed', detail: String(error) },
      { status: 500 }
    )
  }
}
