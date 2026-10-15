create or replace function
  public.enforce_prediction_lock()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_pool_id uuid;
  selected_match_id text;
  selected_user_id uuid;
  selected_status text;
  selected_starts_at timestamp with time zone;
begin
  if tg_op = 'DELETE' then
    selected_pool_id := old.pool_id;
    selected_match_id := old.match_id;
    selected_user_id := old.user_id;
  else
    selected_pool_id := new.pool_id;
    selected_match_id := new.match_id;
    selected_user_id := new.user_id;
  end if;

  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if selected_user_id <> auth.uid() then
    raise exception
      'Você só pode alterar seus próprios palpites.';
  end if;

  select
    pool_match.status,
    match_record.starts_at
  into
    selected_status,
    selected_starts_at
  from public.pool_matches
    as pool_match
  join public.matches
    as match_record
    on match_record.id =
      pool_match.match_id
  where
    pool_match.pool_id =
      selected_pool_id
    and pool_match.match_id =
      selected_match_id;

  if not found then
    raise exception
      'Partida não encontrada neste bolão.';
  end if;

  if selected_status not in (
    'OPEN',
    'SCHEDULED'
  ) then
    raise exception
      'Os palpites desta partida estão encerrados.';
  end if;

  if now() >= selected_starts_at then
    raise exception
      'O prazo para palpitar nesta partida foi encerrado.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;