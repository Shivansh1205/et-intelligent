# Migration from Anthropic Claude to Groq

## ✅ Changes Made

The project has been successfully migrated from Anthropic Claude API to Groq API. Here's what was updated:

### 1. Package Dependencies
- **Removed**: `@anthropic-ai/sdk`
- **Added**: `groq-sdk`

### 2. Environment Variables
- **Old**: `ANTHROPIC_API_KEY`
- **New**: `GROQ_API_KEY`

### 3. AI Model
- **Old**: `claude-sonnet-4-5`
- **New**: `llama-3.3-70b-versatile`

### 4. API Integration (`lib/claude.ts`)
All four AI functions have been updated:

#### `extractEntities()`
- Changed from Anthropic Messages API to Groq Chat Completions API
- System prompt moved to messages array
- Response parsing updated for Groq format

#### `tagSentiment()`
- Changed from Anthropic Messages API to Groq Chat Completions API
- System prompt moved to messages array
- Response parsing updated for Groq format

#### `generateBriefing()`
- Changed from Anthropic Messages API to Groq Chat Completions API
- System prompt moved to messages array
- Response parsing updated for Groq format

#### `answerFollowUp()`
- Changed from Anthropic streaming to Groq streaming
- Updated stream iteration logic
- Changed from `chunk.delta.text` to `chunk.choices[0]?.delta?.content`

### 5. Documentation Updates
- `README.md` — Updated badges, prerequisites, tech stack, acknowledgments
- `QUICKSTART.md` — Updated prerequisites, API key instructions, troubleshooting
- `.env.local` — Updated environment variable name

## 🔑 Getting Your Groq API Key

1. Go to https://console.groq.com
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)
6. Add to `.env.local`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

## 📦 Installation

Run this to install the new Groq SDK:

```bash
npm install
```

This will install `groq-sdk` and remove the old Anthropic SDK.

## 🚀 Usage

Everything else remains the same! The API functions have the same signatures:

```typescript
// Entity extraction
const entities = await extractEntities(title, fullText)

// Sentiment analysis
const sentiment = await tagSentiment(title, summary)

// Briefing generation
const briefing = await generateBriefing(articles)

// Follow-up Q&A (streaming)
const stream = await answerFollowUp(briefing, question)
```

## 🎯 Benefits of Groq

1. **Faster Inference**: Groq's LPU technology provides extremely fast response times
2. **Cost-Effective**: Generally more affordable than Claude
3. **Open Models**: Uses Llama 3.3 70B, a powerful open-source model
4. **High Throughput**: Better for high-volume applications

## ⚠️ Important Notes

1. **Max Tokens**: Increased from 1500 to 2000 for better responses
2. **Model**: Using `llama-3.3-70b-versatile` which is optimized for diverse tasks
3. **Streaming**: Groq streaming works slightly differently but provides the same user experience
4. **JSON Parsing**: Both models are instructed to return pure JSON (no markdown)

## 🧪 Testing

After updating your `.env.local` with the Groq API key:

1. Start the dev server: `npm run dev`
2. Seed the database: 
   ```bash
   curl -X POST http://localhost:3000/api/seed \
     -H "Authorization: Bearer your_cron_secret"
   ```
3. Test entity extraction and sentiment analysis (happens during seeding)
4. Test briefing generation by clicking an article
5. Test follow-up Q&A by asking a question in the briefing

## 📊 API Comparison

| Feature | Anthropic Claude | Groq |
|---------|-----------------|------|
| Model | claude-sonnet-4-5 | llama-3.3-70b-versatile |
| Max Tokens | 1500 | 2000 |
| Streaming | ✅ | ✅ |
| JSON Mode | Via prompt | Via prompt |
| Speed | Fast | Very Fast |
| Cost | Higher | Lower |

## 🔄 Rollback (if needed)

If you need to switch back to Anthropic:

1. Run: `npm install @anthropic-ai/sdk`
2. Revert changes in `lib/claude.ts`
3. Update `.env.local` to use `ANTHROPIC_API_KEY`
4. Update `package.json` dependencies

## ✅ Verification Checklist

- [ ] `groq-sdk` installed
- [ ] `GROQ_API_KEY` set in `.env.local`
- [ ] Dev server starts without errors
- [ ] Seed endpoint works (entity extraction + sentiment)
- [ ] Feed loads articles
- [ ] Briefing generation works
- [ ] Follow-up Q&A streaming works
- [ ] No console errors

---

**Migration Complete! 🎉**

The project is now using Groq API instead of Anthropic Claude. All functionality remains the same, but with faster inference and lower costs.
