create table if not exists
  public.football_sync_state (
    provider text not null,
    championship_id integer not null,

    last_round integer,
    last_attempt_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_error text,

    processed_count integer not null default 0,
    inserted_count integer not null default 0,
    updated_count integer not null default 0,
    skipped_count integer not null default 0,
    synchronized_pool_count integer not null default 0,

    primary key (
      provider,
      championship_id
    )
  );

alter table public.football_sync_state
  enable row level security;

drop policy if exists
  "Administradores consultam sincronizacao"
on public.football_sync_state;

create policy
  "Administradores consultam sincronizacao"
on public.football_sync_state
for select
to authenticated
using (
  public.is_application_admin()
);

revoke all
on public.football_sync_state
from public, anon, authenticated;

grant select
on public.football_sync_state
to authenticated;

grant all
on public.football_sync_state
to service_role;