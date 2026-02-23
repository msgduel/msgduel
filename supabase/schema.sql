-- ⚔️ MsgDuel — Supabase Schema
-- Run this in Supabase SQL Editor

-- Fighters
create table fighters (
  address text primary key,
  name text not null,
  is_ai boolean default false,
  style jsonb default '{"rock":0.2,"paper":0.2,"scissors":0.2,"shield":0.2,"feint":0.2}',
  wins int default 0,
  losses int default 0,
  draws int default 0,
  earnings numeric(12,4) default 0,
  archetype text default 'Balanced',
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- Matches
create table matches (
  id text primary key,
  player1 text references fighters(address),
  player2 text references fighters(address),
  current_round int default 1,
  total_rounds int default 5,
  score_p1 int default 0,
  score_p2 int default 0,
  status text default 'waiting' check (status in ('waiting','ready','in_progress','finished','cancelled')),
  entry_fee numeric(12,4) default 1,
  prize_pool numeric(12,4) default 2,
  winner text,
  created_at timestamptz default now(),
  finished_at timestamptz
);

-- Rounds
create table rounds (
  id serial primary key,
  match_id text references matches(id) on delete cascade,
  round_number int not null,
  p1_move text,
  p2_move text,
  p1_commit text,  -- SHA256 hash
  p2_commit text,
  winner text check (winner in ('player1','player2','draw')),
  description text,
  created_at timestamptz default now()
);

-- Matchmaking queue
create table matchmaking (
  id serial primary key,
  player_address text references fighters(address),
  entry_fee numeric(12,4) default 1,
  status text default 'waiting' check (status in ('waiting','matched','cancelled')),
  matched_with text,
  match_id text references matches(id),
  created_at timestamptz default now()
);

-- Enable Realtime on key tables
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table matchmaking;

-- Row Level Security
alter table fighters enable row level security;
alter table matches enable row level security;
alter table rounds enable row level security;
alter table matchmaking enable row level security;

-- Public read access (game is public)
create policy "Public read fighters" on fighters for select using (true);
create policy "Public read matches" on matches for select using (true);
create policy "Public read rounds" on rounds for select using (true);
create policy "Public read matchmaking" on matchmaking for select using (true);

-- Authenticated write (via service role from API routes)
create policy "Service write fighters" on fighters for all using (true);
create policy "Service write matches" on matches for all using (true);
create policy "Service write rounds" on rounds for all using (true);
create policy "Service write matchmaking" on matchmaking for all using (true);

-- Index for fast lookups
create index idx_matches_status on matches(status);
create index idx_matches_players on matches(player1, player2);
create index idx_rounds_match on rounds(match_id);
create index idx_matchmaking_status on matchmaking(status);
