alter table public.football_sync_state
  add column if not exists
    automatic_request_date date,
  add column if not exists
    automatic_request_count integer
      not null
      default 0;

alter table public.football_sync_state
  drop constraint if exists
    football_sync_state_request_count_check;

alter table public.football_sync_state
  add constraint
    football_sync_state_request_count_check
  check (
    automatic_request_count >= 0
  );

comment on column
  public.football_sync_state.automatic_request_date
is
  'Data de referência, no horário de Belém, para o controle de requisições automáticas.';

comment on column
  public.football_sync_state.automatic_request_count
is
  'Quantidade estimada de requisições automáticas realizadas na data de referência.';