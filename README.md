# ET Intelligence 📈

> **Your personal AI analyst for Indian business news**

A fully functional AI-powered personalized business intelligence platform built for the ET AI Hackathon 2026. Think daily.dev meets Bloomberg Terminal, with genuine AI-driven personalization underneath.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![Groq](https://img.shields.io/badge/Groq-API-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🎯 Personalized Feed
- **Adaptive Learning**: Interest graph updates based on your reading behavior
- **Persona-Aware**: Different rendering for investors, founders, students, and professionals
- **Infinite Scroll**: Seamless content discovery
- **Dual Modes**: "For You" (personalized) and "Trending" (recency-based)

### 🤖 AI-Powered Deep Briefings
- **Multi-Article Synthesis**: Claude combines multiple sources into one intelligence briefing
- **Structured Insights**: Headline, TL;DR, key developments, market impact, predictions
- **Contrarian View**: AI-generated alternative perspective
- **Interactive Q&A**: Ask follow-up questions with streaming responses

### 📊 Story Arc Timeline
- **Visual Evolution**: See how a business story has developed over time
- **Sentiment Tracking**: Color-coded dots show sentiment shifts
- **Smooth Navigation**: Horizontal snap-scrolling timeline

### 🔬 Engagement Retuning
- **Real-Time Learning**: Every click, read, and skip updates your interest graph
- **Transparent Scoring**: Debug panel shows before/after interest scores
- **Smart Decay**: Stale interests fade over time to keep feed fresh

### 🎨 Beautiful UI
- **Dark Mode First**: Bloomberg Terminal aesthetic
- **Custom Typography**: Playfair Display + DM Sans + JetBrains Mono
- **Smooth Animations**: Hover effects, loading states, transitions
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Groq API key

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# 3. Run Supabase migration
# Copy supabase/migrations/001_init.sql to Supabase SQL Editor and run

# 4. Start dev server
npm run dev

# 5. Seed database (in new terminal)
curl -X POST http://localhost:3000/api/seed
```

**📖 For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)**

## 📁 Project Structure

```
et-intelligence/
├── app/
│   ├── api/              # API routes
│   │   ├── seed/         # Database seeding
│   │   ├── ingest/       # Article ingestion
│   │   ├── feed/         # Personalized feed
│   │   ├── briefing/     # AI briefing generation
│   │   ├── engagement/   # Interaction tracking
│   │   └── pipeline-status/
│   ├── article/[id]/     # Deep briefing page
│   ├── feed/             # Main feed page
│   ├── onboarding/       # 3-step onboarding
│   └── page.tsx          # Landing page
├── components/
│   ├── NewsCard.tsx      # Article card
│   ├── FeedGrid.tsx      # Masonry grid
│   ├── OnboardingWizard.tsx
│   ├── DeepBriefing.tsx  # AI briefing display
│   ├── StoryArcTimeline.tsx
│   └── EngagementTracker.tsx
├── lib/
│   ├── supabase/         # Database clients
│   ├── claude.ts         # AI integration
│   ├── pipeline.ts       # Feed ranking
│   ├── scoring.ts        # Interest graph
│   └── seed-articles.ts  # Mock data
├── supabase/
│   └── migrations/
│       └── 001_init.sql  # Database schema
└── middleware.ts         # Auth guard
```

## 🎯 How It Works

### 1. Onboarding
- User selects persona (investor/founder/student/professional)
- Picks 3+ sectors of interest
- Builds company watchlist
- System seeds initial interest graph

### 2. Article Ingestion Pipeline
```
Raw Article
  ↓
[Step 1] Entity Extraction (Claude)
  → Companies, people, sectors, topics
  ↓
[Step 2] Sentiment Tagging (Claude)
  → Score: -1.0 (bearish) to +1.0 (bullish)
  ↓
[Step 3] Store in Database
  → articles table with entities & sentiment
```

### 3. Personalized Feed Ranking
```
User Request
  ↓
Fetch: interest_graph + user_interests + recent articles
  ↓
For each article:
  base_score = 0
  For each entity in article:
    base_score += interest_graph.score × multiplier
    base_score += user_interests.weight × multiplier
  final_score = base_score + sentiment_bonus (if investor)
  ↓
Sort by final_score DESC
  ↓
Return top 20 articles
```

### 4. Engagement Scoring
```
User Interaction
  ↓
Determine delta:
  - click: +0.1
  - read 60s+: +0.3
  - read 30s+: +0.15
  - skip: -0.05
  - bookmark: +0.5
  ↓
For each entity in article:
  new_score = old_score + delta
  Clamp to [-2.0, 5.0]
  Update interest_graph
```

### 5. Deep Briefing Generation
```
Article Click
  ↓
Fetch article + related articles (by shared entities)
  ↓
Call Claude with all articles
  ↓
Generate structured briefing:
  - Headline & TL;DR
  - Key developments (timeline)
  - Key players (with stances)
  - Market impact
  - What to watch
  - Contrarian view
  ↓
Render beautiful UI
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Variables
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth (Google OAuth + Magic Link)
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Fonts**: Playfair Display, DM Sans, JetBrains Mono

## 📊 Database Schema

- `profiles` — User profiles with persona
- `user_interests` — Explicit interests from onboarding
- `articles` — Ingested articles with entities & sentiment
- `user_article_interactions` — Click/read/skip tracking
- `bookmarks` — Saved articles
- `interest_graph` — Dynamic per-user entity scores
- `feed_sessions` — Session-level engagement
- `pipeline_logs` — Ingestion pipeline tracking

**Full schema: [supabase/migrations/001_init.sql](./supabase/migrations/001_init.sql)**

## 🎨 Design System

### Color Palette
```css
--bg-primary: #0A0A0F      /* Near black */
--bg-secondary: #12121A    /* Card background */
--accent-primary: #3B82F6  /* Blue */
--accent-secondary: #8B5CF6 /* Purple */
--positive: #10B981        /* Green */
--negative: #EF4444        /* Red */
```

### Typography
- **Headlines**: Playfair Display (editorial gravitas)
- **Body**: DM Sans (clean, readable)
- **Data**: JetBrains Mono (scores, numbers)

## 🏆 Hackathon Features

### Debug Panel (?debug=true)
Add `?debug=true` to feed URL to see:
- Top 15 interest graph entries
- Before/after score comparison
- Real-time updates as you interact

### Pipeline Status
Visit `/api/pipeline-status` to see:
- Last 10 ingestion runs
- Articles processed
- Entity/sentiment API calls
- Duration

### Mock Data
30 realistic articles covering:
- Zomato, Swiggy, Paytm, Zepto
- Reliance Jio, HDFC Bank, Infosys
- Ola Electric, Byju's
- SEBI regulation, RBI decisions
- Startup funding, IPOs

## 📚 Documentation

- **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** — Comprehensive build documentation
- **[QUICKSTART.md](./QUICKSTART.md)** — Step-by-step setup guide
- **[supabase/migrations/001_init.sql](./supabase/migrations/001_init.sql)** — Database schema

## 🐛 Troubleshooting

See [QUICKSTART.md](./QUICKSTART.md#-troubleshooting) for common issues and solutions.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Update environment variables in Vercel dashboard and Supabase redirect URLs.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built for the ET AI Hackathon 2026
- Powered by Groq AI
- Database by Supabase
- Deployed on Vercel

---

**Built with ❤️ by [Your Name]**
