import Groq from 'groq-sdk'
import type { BriefingResponse } from './claude'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

export interface SimulationResult {
  bull_case: string
  bear_case: string
  most_likely: string
  key_variables: string[]
}

export async function generateFutureScenarios(
  briefing: BriefingResponse
): Promise<SimulationResult | null> {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior financial strategist. Based on this business situation, generate future scenarios. Return ONLY valid JSON with no markdown, no backticks, no explanation:\n{"bull_case":string,"bear_case":string,"most_likely":string,"key_variables":string[]}\nKeep each scenario 2-3 lines. Be realistic, not dramatic. key_variables should be 3-5 items.',
        },
        {
          role: 'user',
          content: `Briefing: ${JSON.stringify({
            headline: briefing.headline,
            tldr: briefing.tldr,
            market_impact: briefing.market_impact,
            key_developments: briefing.key_developments.map((d) => d.point),
            sentiment: briefing.sentiment,
          })}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(text)
  } catch {
    return null
  }
}
