-- ============================================================
-- Flashcard Tortue — Schéma Supabase
-- ============================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- (ou via l'API management si vous disposez d'un token de compte).
-- ============================================================

-- ---------- 1. COLLECTIONS ----------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  lang_from   text default 'en',
  lang_to     text default 'fr',
  is_public   boolean default true,
  position    int default 0,
  created_at  timestamptz default now()
);

-- ---------- 2. CARTES ----------
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  front         text not null,          -- recto (ex. "go")
  back          text not null,          -- verso (ex. "went / gone")
  extra         text,                   -- complément (ex. traduction FR)
  level         int default 1,          -- 1 = essentiel, 2 = courant, 3 = avancé
  position      int default 0,
  created_at    timestamptz default now()
);
create index if not exists cards_collection_idx on public.cards(collection_id);

-- ---------- 3. RÉVISIONS (état SM-2 par utilisateur × carte) ----------
create table if not exists public.reviews (
  user_id       uuid not null references auth.users(id) on delete cascade,
  card_id       uuid not null references public.cards(id) on delete cascade,
  ease          real    default 2.5,    -- facteur de facilité (SM-2)
  interval_days int     default 0,      -- intervalle courant en jours
  repetitions   int     default 0,      -- nombre de succès consécutifs
  lapses        int     default 0,      -- nombre d'échecs
  due_at        timestamptz default now(),
  last_grade    int,                    -- dernière note (0-3)
  last_seen_at  timestamptz,
  primary key (user_id, card_id)
);
create index if not exists reviews_due_idx on public.reviews(user_id, due_at);

-- ---------- 4. STATS UTILISATEUR ----------
create table if not exists public.user_stats (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  score         int default 0,          -- score global (points cumulés)
  total_reviews int default 0,
  streak_days   int default 0,
  best_streak   int default 0,
  last_activity date,
  updated_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.collections enable row level security;
alter table public.cards       enable row level security;
alter table public.reviews     enable row level security;
alter table public.user_stats  enable row level security;

-- Collections & cartes : lecture publique (contenu pédagogique), écriture service_role only
drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections
  for select using (is_public = true);

drop policy if exists cards_read on public.cards;
create policy cards_read on public.cards
  for select using (
    exists (select 1 from public.collections c where c.id = collection_id and c.is_public = true)
  );

-- Révisions : chacun ne voit/modifie que les siennes
drop policy if exists reviews_own on public.reviews;
create policy reviews_own on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stats : chacun ne voit/modifie que les siennes
drop policy if exists stats_own on public.user_stats;
create policy stats_own on public.user_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- COLLECTION 1 : Verbes irréguliers anglais
-- ============================================================
insert into public.collections (slug, title, description, lang_from, lang_to, is_public, position)
values (
  'verbes-irreguliers-anglais',
  'Verbes irréguliers anglais',
  'Les verbes irréguliers essentiels : base, prétérit, participe passé et traduction.',
  'en', 'fr', true, 1
)
on conflict (slug) do nothing;
