-- Ejecutar una vez en el SQL Editor de Supabase para habilitar el orden manual de tarjetas.

alter table public.cards
  add column if not exists sort_order integer not null default 0;

with ranked_cards as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc) as next_sort_order
  from public.cards
)
update public.cards
set sort_order = ranked_cards.next_sort_order
from ranked_cards
where public.cards.id = ranked_cards.id
  and public.cards.sort_order = 0;

create index if not exists cards_user_sort_order
  on public.cards(user_id, sort_order, created_at);
