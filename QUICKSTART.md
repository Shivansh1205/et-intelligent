# 🚀 Quick Start Guide — ET Intelligence

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Groq API key

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

#### A. Create a Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name it "et-intelligence"
4. Set a database password
5. Wait for project to be ready (~2 minutes)

#### B. Run the Migration
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_init.sql`
4. Paste and click "Run"
5. Verify all tables were created (check "Table Editor")

#### C. Enable Google OAuth (Optional)
1. Go to "Authentication" → "Providers"
2. Enable "Google"
3. Add your Google OAuth credentials
4. Add redirect URL: `http://localhost:3000/auth/callback`

### 3. Get Your API Keys

#### Supabase Keys
1. In Supabase dashboard, go to "Settings" → "API"
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

#### Groq API Key
1. Go to https://console.groq.com
2. Create an account or sign in
3. Go to "API Keys"
4. Click "Create API Key"
5. Copy the key → `GROQ_API_KEY`

### 4. Configure Environment Variables

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=gsk_...
```

### 5. Start the Dev Server
```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 6. Seed the Database

Open a new terminal and run:
```bash
curl -X POST http://localhost:3000/api/seed
```

**Expected output:**
```json
{
  "success": true,
  "message": "Seeded 30 articles (0 skipped)",
  "inserted": 30,
  "skipped": 0,
  "duration_ms": 45000,
  "entity_calls": 30,
  "sentiment_calls": 30
}
```

**Note:** This will take ~1-2 minutes because it calls Groq API 60 times (30 articles × 2 calls each).

### 7. Test the Application

#### A. Landing Page
1. Open `http://localhost:3000`
2. You should see the animated landing page

#### B. Sign In
- Click "Continue with Google" (if configured)
- OR click "Sign in with Magic Link" and enter your email

#### C. Onboarding
1. Select a persona (e.g., "Investor")
2. Pick 3+ sectors
3. Select companies
4. Click "Launch my feed 🚀"

#### D. Feed
1. You should see 20 personalized articles
2. Toggle between "For You" and "Trending"
3. Scroll down to test infinite scroll
4. Click an article card

#### E. Deep Briefing
1. Wait for AI briefing to generate (~5-10 seconds)
2. Scroll through the briefing
3. Check the Story Arc Timeline
4. Ask a follow-up question

#### F. Debug Panel
1. Go back to feed
2. Add `?debug=true` to URL: `http://localhost:3000/feed?debug=true`
3. See the debug panel in bottom-right
4. Click some articles, then click "Refresh" in debug panel
5. Watch the interest graph scores change

## 🐛 Troubleshooting

### Issue: "Unauthorized" error on /api/seed
**Solution:** This error has been removed. The seed endpoint is now open and requires no authentication.

### Issue: "Failed to fetch" on feed
**Solution:** 
1. Check that you've run the seed endpoint
2. Verify Supabase connection (check browser console)
3. Make sure you're signed in

### Issue: Briefing generation fails
**Solution:**
1. Check your Groq API key is valid
2. Verify you have API credits
3. Check browser console for errors

### Issue: Google OAuth not working
**Solution:**
1. Verify redirect URL in Google Console: `http://localhost:3000/auth/callback`
2. Check Supabase Auth settings
3. Try Magic Link instead

### Issue: Articles not showing in feed
**Solution:**
1. Make sure seed endpoint completed successfully
2. Check Supabase Table Editor → `articles` table should have 30 rows
3. Try "Trending" mode instead of "For You"

### Issue: Interest graph not updating
**Solution:**
1. Make sure you're clicking articles (not just viewing feed)
2. Check browser console for engagement API errors
3. Verify RLS policies in Supabase

## 📊 Verify Everything Works

### Check Database Tables
In Supabase Table Editor, verify:
- ✅ `profiles` has your user row
- ✅ `user_interests` has your onboarding selections
- ✅ `interest_graph` has initial scores
- ✅ `articles` has 30 rows
- ✅ `user_article_interactions` gets rows when you click articles

### Check API Endpoints
Test these URLs in browser:
- ✅ `http://localhost:3000/api/pipeline-status` → should return JSON with logs
- ✅ `http://localhost:3000/feed` → should show feed page
- ✅ `http://localhost:3000/feed?debug=true` → should show debug panel

### Check Groq API Usage
1. Go to https://console.groq.com
2. Check "Usage" tab
3. You should see API calls from seeding + briefing generation

## 🎯 Demo Checklist

Before demoing to judges:
- [ ] Database seeded with 30 articles
- [ ] Can sign in successfully
- [ ] Onboarding flow works
- [ ] Feed loads with articles
- [ ] Can click article and see briefing
- [ ] Follow-up Q&A works
- [ ] Debug panel shows interest graph
- [ ] Story arc timeline displays
- [ ] Infinite scroll works
- [ ] Bookmark button works

## 🚀 Production Deployment (Optional)

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Update Environment Variables
In Vercel dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add all variables from `.env.local`
3. Update Supabase redirect URLs to your Vercel domain

### Update Supabase Auth
1. In Supabase dashboard, go to "Authentication" → "URL Configuration"
2. Add your Vercel domain to "Site URL"
3. Add redirect URL: `https://your-app.vercel.app/auth/callback`

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🆘 Need Help?

Check these files for reference:
- `BUILD_SUMMARY.md` — comprehensive build documentation
- `supabase/migrations/001_init.sql` — database schema
- `lib/claude.ts` — AI integration examples
- `lib/pipeline.ts` — feed ranking logic

---

**Happy Hacking! 🚀**
