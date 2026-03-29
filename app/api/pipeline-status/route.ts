import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: logs, error } = await supabase
      .from('pipeline_logs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(10)

    if (error) {
      return Response.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return Response.json({ logs: logs ?? [] })
  } catch (error) {
    console.error('Pipeline status error:', error)
    return Response.json({ error: 'Status fetch failed' }, { status: 500 })
  }
}
