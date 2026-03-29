import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOKENS = 2000

export interface EntitiesResult {
  companies: string[]
  people: string[]
  sectors: string[]
  topics: string[]
}

export interface SentimentResult {
  score: number
  reasoning: string
}

export interface BriefingResponse {
  headline: string
  tldr: string
  key_developments: Array<{ point: string; source_article_index: number }>
  key_players: Array<{ name: string; role: string; stance: string }>
  market_impact: string
  what_to_watch: string[]
  contrarian_view: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export async function extractEntities(title: string, fullText: string): Promise<EntitiesResult | null> {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: 'You are an entity extractor for Indian business news. Extract structured data from the article. Return only valid JSON with no markdown formatting, no backticks, no explanation. Return exactly this shape: { companies: string[], people: string[], sectors: string[], topics: string[] }. Sectors must be chosen from: fintech, edtech, healthtech, ecommerce, manufacturing, banking, real-estate, startup-funding, policy, markets, energy, consumer, media, telecom. Topics are 2-4 word descriptive phrases.',
        },
        {
          role: 'user',
          content: `Article title: ${title}\n\nArticle text: ${fullText}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function tagSentiment(title: string, summary: string): Promise<SentimentResult | null> {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: 'You are a financial sentiment analyser. Given this business news article, return a sentiment score between -1.0 (very negative for business/markets) and +1.0 (very positive). Return only a JSON object: { score: number, reasoning: string }. The reasoning should be one sentence max.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nSummary: ${summary}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function generateBriefing(articles: Array<{ title: string; summary: string; published_at: string }>): Promise<BriefingResponse | null> {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: `You are a senior financial analyst for Economic Times. You have been given multiple articles about the same business story. Synthesise them into a structured intelligence briefing. Return valid JSON only, no markdown, no backticks. Return this exact shape:
{
  "headline": string,
  "tldr": string,
  "key_developments": [{ "point": string, "source_article_index": number }],
  "key_players": [{ "name": string, "role": string, "stance": string }],
  "market_impact": string,
  "what_to_watch": [string, string, string],
  "contrarian_view": string,
  "sentiment": "bullish" | "bearish" | "neutral"
}`,
        },
        {
          role: 'user',
          content: `Articles: ${JSON.stringify(articles)}`,
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function answerFollowUp(briefing: BriefingResponse, question: string): Promise<ReadableStream> {
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are an expert financial analyst. The user has read a synthesised intelligence briefing about a business story. Answer their follow-up question concisely and accurately based on the briefing context. Be direct — 3 paragraphs maximum.',
      },
      {
        role: 'user',
        content: `Briefing context: ${JSON.stringify(briefing)}\n\nQuestion: ${question}`,
      },
    ],
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}
