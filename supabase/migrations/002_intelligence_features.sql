-- Intelligence Features: Future Simulation, Decision Insights, Contradiction Detection

create table public.article_simulations (
  id uuid default uuid_generate_v4() primary key,
  article_id uuid references public.articles(id) on delete cascade unique,
  content jsonb not null,
  created_at timestamptz default now()
);
create index article_simulations_article_id_idx on public.article_simulations(article_id);

create table public.decision_insights (
  id uuid default uuid_generate_v4() primary key,
  article_id uuid references public.articles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  persona text not null,
  content jsonb not null,
  created_at timestamptz default now(),
  unique(article_id, user_id, persona)
);
alter table public.decision_insights enable row level security;
create policy "Users manage own decision insights"
  on public.decision_insights for all using (auth.uid() = user_id);
create index decision_insights_article_user_idx on public.decision_insights(article_id, user_id);

create table public.article_contradictions (
  id uuid default uuid_generate_v4() primary key,
  article_id uuid references public.articles(id) on delete cascade unique,
  content jsonb not null,
  created_at timestamptz default now()
);
create index article_contradictions_article_id_idx on public.article_contradictions(article_id);
