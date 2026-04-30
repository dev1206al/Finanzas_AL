-- ============================================================
-- FINANZAS AL — Supabase Schema
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  -- 'expense' | 'lent' | 'income'
  -- lent = categorías de dinero prestado (Mamá, Papá, Prestado)
  type text not null default 'expense' check (type in ('expense', 'lent', 'income')),
  color text not null default '#6366f1',
  icon text,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;
create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id);

-- ============================================================
-- CARDS (Tarjetas de crédito)
-- ============================================================
create table public.cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  bank text,
  color text not null default '#6366f1',
  credit_limit numeric(12,2) not null default 0,
  cut_day integer not null check (cut_day between 1 and 31),   -- día de corte mensual
  payment_day integer not null check (payment_day between 1 and 31), -- día de pago mensual
  last_four text,  -- últimos 4 dígitos (opcional)
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.cards enable row level security;
create policy "Users manage own cards" on public.cards
  for all using (auth.uid() = user_id);

-- ============================================================
-- PAYMENT DATE EXCEPTIONS (Excepciones de fecha de pago)
-- ============================================================
create table public.payment_exceptions (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid references public.cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  original_date date not null,  -- fecha original según regla mensual
  new_date date not null,        -- fecha real ajustada
  reason text,                   -- ej: "día festivo", "fin de semana"
  created_at timestamptz default now()
);

alter table public.payment_exceptions enable row level security;
create policy "Users manage own payment exceptions" on public.payment_exceptions
  for all using (auth.uid() = user_id);

-- ============================================================
-- MOVEMENTS (Movimientos de tarjeta de crédito)
-- ============================================================
create table public.movements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  date date not null,
  merchant text not null,          -- nombre del establecimiento / concepto
  -- amount SIEMPRE negativo para gastos, positivo para pagos/ingresos a tarjeta
  amount numeric(12,2) not null,
  -- 'expense' | 'payment' | 'income'
  type text not null default 'expense' check (type in ('expense', 'payment', 'income')),
  msi_months integer,              -- null = pago normal, 2-48 = meses sin intereses
  msi_parent_id uuid references public.movements(id) on delete cascade, -- cuota MSI padre
  notes text,
  created_at timestamptz default now()
);

alter table public.movements enable row level security;
create policy "Users manage own movements" on public.movements
  for all using (auth.uid() = user_id);

-- Índices para queries frecuentes
create index movements_user_date on public.movements(user_id, date);
create index movements_card on public.movements(card_id);

-- ============================================================
-- INCOME ACCOUNTS (Cuentas de ingreso: débito, ahorro, nómina)
-- ============================================================
create table public.income_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  bank text,
  -- 'checking' | 'savings' | 'payroll' | 'cash' | 'other'
  type text not null default 'checking' check (type in ('checking', 'savings', 'payroll', 'cash', 'other')),
  color text not null default '#10b981',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.income_accounts enable row level security;
create policy "Users manage own income accounts" on public.income_accounts
  for all using (auth.uid() = user_id);

-- ============================================================
-- INCOME MOVEMENTS (Movimientos de cuentas de ingreso)
-- ============================================================
create table public.income_movements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.income_accounts(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  date date not null,
  concept text not null,
  -- positivo = ingreso, negativo = egreso (débito/efectivo)
  amount numeric(12,2) not null,
  -- 'income' | 'expense'
  type text not null default 'income' check (type in ('income', 'expense')),
  notes text,
  created_at timestamptz default now()
);

alter table public.income_movements enable row level security;
create policy "Users manage own income movements" on public.income_movements
  for all using (auth.uid() = user_id);

create index income_movements_user_date on public.income_movements(user_id, date);

-- ============================================================
-- SEED: Categorías predefinidas por usuario
-- (Ejecutar esta función tras el primer registro de cada usuario,
--  o invocarla desde la app al crear la cuenta)
-- ============================================================
create or replace function public.seed_default_categories(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.categories (user_id, name, type, color) values
    (p_user_id, 'Mamá',             'lent',    '#f43f5e'),
    (p_user_id, 'Papá',             'lent',    '#f97316'),
    (p_user_id, 'Ropa',             'expense', '#8b5cf6'),
    (p_user_id, 'Combustible',      'expense', '#eab308'),
    (p_user_id, 'Vicios',           'expense', '#6366f1'),
    (p_user_id, 'Estacionamiento',  'expense', '#64748b'),
    (p_user_id, 'Comida',           'expense', '#ef4444'),
    (p_user_id, 'Servicios',        'expense', '#0ea5e9'),
    (p_user_id, 'Regalos',          'expense', '#ec4899'),
    (p_user_id, 'Banco',            'expense', '#1d4ed8'),
    (p_user_id, 'Escuela',          'expense', '#7c3aed'),
    (p_user_id, 'Entretenimiento',  'expense', '#06b6d4'),
    (p_user_id, 'Cuidado Personal', 'expense', '#d946ef'),
    (p_user_id, 'Supermercado',     'expense', '#16a34a'),
    (p_user_id, 'Otros',            'expense', '#94a3b8'),
    (p_user_id, 'Hogar',            'expense', '#78716c'),
    (p_user_id, 'Medicina',         'expense', '#10b981'),
    (p_user_id, 'Prestado',         'lent',    '#fb923c'),
    (p_user_id, 'Coche',            'expense', '#475569'),
    (p_user_id, 'Fotografía',       'expense', '#a855f7'),
    (p_user_id, 'Pago',             'income',  '#22c55e');
end;
$$;
