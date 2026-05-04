-- GROUPS
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  topic text not null default '',
  owner_id uuid not null,
  bots_allowed boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.groups enable row level security;

create policy "groups viewable" on public.groups for select to authenticated using (true);
create policy "users create groups" on public.groups for insert to authenticated
  with check (auth.uid() = owner_id and not is_banned(auth.uid()));
create policy "owner or admin update group" on public.groups for update to authenticated
  using (auth.uid() = owner_id or has_role(auth.uid(),'admin'));
create policy "owner or admin delete group" on public.groups for delete to authenticated
  using (auth.uid() = owner_id or has_role(auth.uid(),'admin'));

-- MEMBERS
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

create or replace function public.is_group_member(_gid uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.group_members where group_id = _gid and user_id = _uid)
$$;

create or replace function public.is_group_admin(_gid uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.group_members where group_id = _gid and user_id = _uid and role in ('owner','admin'))
$$;

create policy "members viewable" on public.group_members for select to authenticated using (true);
create policy "user joins self" on public.group_members for insert to authenticated
  with check (auth.uid() = user_id and not is_banned(auth.uid()));
create policy "user leaves self" on public.group_members for delete to authenticated
  using (auth.uid() = user_id);
create policy "admin manage members del" on public.group_members for delete to authenticated
  using (public.is_group_admin(group_id, auth.uid()) or has_role(auth.uid(),'admin'));
create policy "admin manage members upd" on public.group_members for update to authenticated
  using (public.is_group_admin(group_id, auth.uid()) or has_role(auth.uid(),'admin'));

-- GROUP POSTS
create table public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.group_posts enable row level security;

create policy "gposts viewable" on public.group_posts for select to authenticated using (true);
create policy "members post" on public.group_posts for insert to authenticated
  with check (auth.uid() = author_id and not is_banned(auth.uid()) and public.is_group_member(group_id, auth.uid()));
create policy "delete own gpost" on public.group_posts for delete to authenticated
  using (auth.uid() = author_id or has_role(auth.uid(),'admin') or public.is_group_admin(group_id, auth.uid()));

-- GROUP REPLIES
create table public.group_post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.group_posts(id) on delete cascade,
  author_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.group_post_replies enable row level security;

create policy "greplies viewable" on public.group_post_replies for select to authenticated using (true);
create policy "greply own" on public.group_post_replies for insert to authenticated
  with check (auth.uid() = author_id and not is_banned(auth.uid()));
create policy "delete own greply" on public.group_post_replies for delete to authenticated
  using (auth.uid() = author_id or has_role(auth.uid(),'admin'));

-- GROUP LIKES
create table public.group_post_likes (
  post_id uuid not null references public.group_posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.group_post_likes enable row level security;

create policy "glikes viewable" on public.group_post_likes for select to authenticated using (true);
create policy "glike self" on public.group_post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "gunlike self" on public.group_post_likes for delete to authenticated using (auth.uid() = user_id);

-- BOT SETTINGS (single-row)
create table public.bot_settings (
  id int primary key default 1,
  enabled boolean not null default true,
  weight_post int not null default 45,
  weight_reply int not null default 35,
  weight_like int not null default 20,
  max_bots_per_tick int not null default 2,
  max_posts_per_day int not null default 6,
  allow_self_reply boolean not null default true,
  self_reply_chance int not null default 15,
  allow_group_posts boolean not null default true,
  group_post_chance int not null default 30,
  tick_minutes int not null default 60,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
alter table public.bot_settings enable row level security;

create policy "settings readable" on public.bot_settings for select to authenticated using (true);
create policy "admin update settings" on public.bot_settings for update to authenticated using (has_role(auth.uid(),'admin'));
create policy "admin insert settings" on public.bot_settings for insert to authenticated with check (has_role(auth.uid(),'admin'));

insert into public.bot_settings (id) values (1) on conflict (id) do nothing;

-- bot_runs context
alter table public.bot_runs add column if not exists group_id uuid;