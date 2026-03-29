import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

export interface ContradictionResult {
  contradiction: boolean
  summary: string
  viewpoints: string[]
}

export async function detectContradictions(
  articles: Array<{ title: string; summary: string; sentiment_score: number }>
): Promise<ContradictionResult | null> {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'You are an analyst. Identify if there are conflicting narratives across these articles. Return ONLY valid JSON with no markdown, no backticks:\n{"contradiction":boolean,"summary":string,"viewpoints":string[]}\nIf no contradiction, set contradiction=false and viewpoints=[]. summary is 1-2 sentences. viewpoints should be 2-3 items when contradiction=true.',
        },
        {
          role: 'user',
          content: `Articles: ${JSON.stringify(
            articles.map((a) => ({ title: a.title, summary: a.summary, sentiment: a.sentiment_score }))
          )}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(text)
  } catch {
    return null
  }
}
