-- DapurHitung - Supabase schema for per-user auth + isolated business data
-- Model v1:
-- - Each authenticated user owns exactly one business
-- - Data is isolated per user/business
-- - Login methods: email/password and Google OAuth

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Usaha Saya',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nama text not null,
  fee numeric(7,2) not null default 0 check (fee >= 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, nama)
);

create table if not exists public.overheads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  biaya_tetap_bulanan numeric(14,2) not null default 3500000 check (biaya_tetap_bulanan >= 0),
  estimasi_porsi_bulanan integer not null default 1800 check (estimasi_porsi_bulanan > 0),
  biaya_tenaga_kerja_bulanan numeric(14,2) not null default 4000000 check (biaya_tenaga_kerja_bulanan >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nama text not null,
  kategori text not null default 'Utama',
  satuan text not null,
  harga numeric(14,2) not null default 0 check (harga >= 0),
  tipe_menu text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nama text not null,
  kategori text not null,
  porsi_per_batch integer not null default 1 check (porsi_per_batch > 0),
  margin jsonb not null default '{"Dine-in": 40, "Online": 50, "Katering": 30}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty numeric(14,2) not null default 0 check (qty >= 0),
  unit text not null,
  susut numeric(5,2) not null default 0 check (susut >= 0 and susut < 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_user_id on public.businesses(user_id);
create index if not exists idx_channels_business_id on public.channels(business_id);
create index if not exists idx_overheads_business_id on public.overheads(business_id);
create index if not exists idx_ingredients_business_id on public.ingredients(business_id);
create index if not exists idx_menus_business_id on public.menus(business_id);
create index if not exists idx_menu_items_menu_id on public.menu_items(menu_id);
create index if not exists idx_menu_items_ingredient_id on public.menu_items(ingredient_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
  provider_name text;
  derived_full_name text;
begin
  provider_name := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  derived_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'User'), '@', 1)
  );

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    derived_full_name,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

  insert into public.businesses (user_id, name)
  values (
    new.id,
    case
      when provider_name = 'google' then derived_full_name || ' Kitchen'
      else 'Usaha Saya'
    end
  )
  on conflict (user_id) do update
    set updated_at = now()
  returning id into new_business_id;

  insert into public.channels (business_id, nama, fee, aktif)
  values
    (new_business_id, 'Dine-in', 0, true),
    (new_business_id, 'Online', 20, true),
    (new_business_id, 'Katering', 0, true)
  on conflict (business_id, nama) do nothing;

  insert into public.overheads (
    business_id,
    biaya_tetap_bulanan,
    estimasi_porsi_bulanan,
    biaya_tenaga_kerja_bulanan
  )
  values (new_business_id, 3500000, 1800, 4000000)
  on conflict (business_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
  before update on public.businesses
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_channels_updated_at on public.channels;
create trigger set_channels_updated_at
  before update on public.channels
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_overheads_updated_at on public.overheads;
create trigger set_overheads_updated_at
  before update on public.overheads
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_ingredients_updated_at on public.ingredients;
create trigger set_ingredients_updated_at
  before update on public.ingredients
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_menus_updated_at on public.menus;
create trigger set_menus_updated_at
  before update on public.menus
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
  before update on public.menu_items
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.channels enable row level security;
alter table public.overheads enable row level security;
alter table public.ingredients enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- businesses
create policy "businesses_select_own"
  on public.businesses for select
  using (auth.uid() = user_id);

create policy "businesses_insert_own"
  on public.businesses for insert
  with check (auth.uid() = user_id);

create policy "businesses_update_own"
  on public.businesses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "businesses_delete_own"
  on public.businesses for delete
  using (auth.uid() = user_id);

-- channels
create policy "channels_crud_own_business"
  on public.channels for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- overheads
create policy "overheads_crud_own_business"
  on public.overheads for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- ingredients
create policy "ingredients_crud_own_business"
  on public.ingredients for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- menus
create policy "menus_crud_own_business"
  on public.menus for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- menu_items
create policy "menu_items_crud_own_business"
  on public.menu_items for all
  using (
    exists (
      select 1
      from public.menus m
      join public.businesses b on b.id = m.business_id
      where m.id = menu_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.menus m
      join public.businesses b on b.id = m.business_id
      where m.id = menu_id and b.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.ingredients i
      join public.businesses b on b.id = i.business_id
      where i.id = ingredient_id and b.user_id = auth.uid()
    )
  );
