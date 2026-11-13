alter table public.football_sync_state
  add column if not exists
    manual_request_date date,
  add column if not exists
    manual_request_count integer
      not null default 0;

alter table public.football_sync_state
  drop constraint if exists
    football_sync_state_manual_request_count_check;

alter table public.football_sync_state
  add constraint
    football_sync_state_manual_request_count_check
  check (
    manual_request_count >= 0
  );

create or replace function
  public.claim_manual_api_football_request(
    target_provider text,
    target_championship_id integer,
    request_date_value date,
    request_limit_value integer
  )
returns table (
  request_allowed boolean,
  request_count integer,
  request_limit integer
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_request_date date;
  selected_request_count integer;
begin
  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not public.is_application_admin() then
    raise exception
      'Apenas administradores podem consumir a reserva manual da API.';
  end if;

  if target_provider is null
     or trim(target_provider) = ''
     or target_championship_id is null
     or target_championship_id < 1
  then
    raise exception
      'Provedor ou campeonato inválido.';
  end if;

  if request_date_value is null then
    raise exception
      'A data da requisição é inválida.';
  end if;

  if request_limit_value is null
     or request_limit_value < 1
  then
    raise exception
      'O limite de requisições é inválido.';
  end if;

  insert into public.football_sync_state (
    provider,
    championship_id,
    manual_request_date,
    manual_request_count
  )
  values (
    trim(target_provider),
    target_championship_id,
    request_date_value,
    0
  )
  on conflict (
    provider,
    championship_id
  )
  do nothing;

  select
    state.manual_request_date,
    state.manual_request_count
  into
    selected_request_date,
    selected_request_count
  from public.football_sync_state as state
  where
    state.provider =
      trim(target_provider)
    and state.championship_id =
      target_championship_id
  for update;

  if selected_request_date
       is distinct from
       request_date_value
  then
    selected_request_count := 0;
  end if;

  if selected_request_count >=
     request_limit_value
  then
    return query
    select
      false,
      selected_request_count,
      request_limit_value;

    return;
  end if;

  selected_request_count :=
    selected_request_count + 1;

  update public.football_sync_state
  set
    manual_request_date =
      request_date_value,
    manual_request_count =
      selected_request_count
  where
    provider =
      trim(target_provider)
    and championship_id =
      target_championship_id;

  return query
  select
    true,
    selected_request_count,
    request_limit_value;
end;
$function$;

revoke all
on function
  public.claim_manual_api_football_request(
    text,
    integer,
    date,
    integer
  )
from public;

grant execute
on function
  public.claim_manual_api_football_request(
    text,
    integer,
    date,
    integer
  )
to authenticated;