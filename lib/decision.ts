import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

export interface DecisionResult {
  summary: string
  actions: string[]
  risks: string[]
  confidence: number
}

const PERSONA_FOCUS: Record<string, string> = {
  investor: 'Focus on stock implications, sector exposure, portfolio positioning, and market timing.',
  founder: 'Focus on competitive dynamics, strategic opportunities, business model impact, and execution risks.',
  student: 'Explain the business concepts involved, what this means for the industry, and key learning points.',
  professional: 'Focus on industry trends, policy implications, career relevance, and professional positioning.',
}

export async function generateDecisionInsights(
  article: { title: string; summary: string; entities: Record<string, string[]> },
  persona: string
): Promise<DecisionResult | null> {
  try {
    const focus = PERSONA_FOCUS[persona] ?? PERSONA_FOCUS.professional
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `You are a business advisor. Based on this article and user persona, give actionable insight. ${focus}\nReturn ONLY valid JSON with no markdown, no backticks:\n{"summary":string,"actions":string[],"risks":string[],"confidence":number}\nconfidence must be 0-100. actions and risks should be 2-4 items each. summary is 2 sentences max.`,
        },
        {
          role: 'user',
          content: `Persona: ${persona}\n\nArticle title: ${article.title}\n\nSummary: ${article.summary}\n\nKey entities: ${JSON.stringify(article.entities)}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    const result = JSON.parse(text)
    result.confidence = Math.min(100, Math.max(0, Number(result.confidence)))
    return result
  } catch {
    return null
  }
}
