create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  gif_id text not null check (gif_id ~ '^[A-Za-z0-9]{1,64}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, gif_id)
);

alter table public.favorites enable row level security;

-- Remove legacy/default Data API grants before granting only necessary actions.
revoke all on table public.favorites from public, anon, authenticated;
grant select, insert, delete on table public.favorites to authenticated;

create policy "Read own favorites"
  on public.favorites for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Save own favorites"
  on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Remove own favorites"
  on public.favorites for delete to authenticated
  using ((select auth.uid()) = user_id);
