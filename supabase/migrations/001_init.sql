-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles: one row per user, created on signup
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  persona text check (persona in ('investor', 'founder', 'student', 'professional')),
  onboarding_done boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can manage own profile"
  on public.profiles for all using (auth.uid() = id);

-- Trigger: auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- User interests: topics/sectors/companies declared at onboarding
create table public.user_interests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  interest_type text check (interest_type in ('sector', 'company', 'topic', 'person')),
  interest_value text not null,
  weight float default 1.0,
  created_at timestamptz default now()
);
alter table public.user_interests enable row level security;
create policy "Users manage own interests"
  on public.user_interests for all using (auth.uid() = user_id);

-- Articles: ET articles post-pipeline (cached locally)
create table public.articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  source_url text unique not null,
  summary text,
  full_text text,
  image_url text,
  entities jsonb default '{}',
  topic_tags text[] default '{}',
  sentiment_score float,
  published_at timestamptz,
  ingested_at timestamptz default now()
);
create index articles_published_at_idx on public.articles(published_at desc);
create index articles_entities_idx on public.articles using gin(entities);
create index articles_topic_tags_idx on public.articles using gin(topic_tags);

-- User article interactions
create table public.user_article_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  interaction_type text check (interaction_type in ('click', 'read', 'skip', 'share')),
  dwell_seconds int default 0,
  scroll_depth int default 0,
  created_at timestamptz default now()
);
alter table public.user_article_interactions enable row level security;
create policy "Users manage own interactions"
  on public.user_article_interactions for all using (auth.uid() = user_id);
create index interactions_user_id_idx on public.user_article_interactions(user_id);
create index interactions_article_id_idx on public.user_article_interactions(article_id);

-- Bookmarks
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  note text,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);
alter table public.bookmarks enable row level security;
create policy "Users manage own bookmarks"
  on public.bookmarks for all using (auth.uid() = user_id);

-- Interest graph
create table public.interest_graph (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  entity_type text check (entity_type in ('company', 'sector', 'topic', 'person')),
  entity_value text not null,
  score float default 0.0,
  last_updated timestamptz default now(),
  unique(user_id, entity_type, entity_value)
);
alter table public.interest_graph enable row level security;
create policy "Users view own interest graph"
  on public.interest_graph for all using (auth.uid() = user_id);

-- Feed sessions
create table public.feed_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  articles_shown int default 0,
  articles_clicked int default 0,
  avg_dwell_seconds float default 0,
  session_start timestamptz default now(),
  session_end timestamptz
);
alter table public.feed_sessions enable row level security;
create policy "Users manage own sessions"
  on public.feed_sessions for all using (auth.uid() = user_id);

-- Pipeline run logs
create table public.pipeline_logs (
  id uuid default uuid_generate_v4() primary key,
  run_at timestamptz default now(),
  articles_processed int default 0,
  entity_calls int default 0,
  sentiment_calls int default 0,
  duration_ms int default 0,
  status text default 'completed'
);
