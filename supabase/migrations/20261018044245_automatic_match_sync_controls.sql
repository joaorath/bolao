alter table public.matches
  add column if not exists
    automatic_sync_enabled boolean
    not null
    default false,
  add column if not exists
    manual_override_at
    timestamp with time zone,
  add column if not exists
    manual_override_by uuid;

update public.matches
set automatic_sync_enabled = true
where provider = 'api-futebol'
  and automatic_sync_enabled = false
  and manual_override_at is null;

alter table public.matches
  drop constraint if exists
    matches_manual_override_by_fkey;

alter table public.matches
  add constraint
    matches_manual_override_by_fkey
  foreign key (manual_override_by)
  references public.profiles(id)
  on delete set null;


create or replace function
  public.mark_manual_match_override()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  /*
   * Uma sincronização da API sempre altera
   * last_synced_at. Uma edição feita pelo
   * painel administrativo não altera esse campo.
   */
  if
    old.provider <> 'manual'
    and new.last_synced_at
      is not distinct from
        old.last_synced_at
    and (
      new.competition
        is distinct from old.competition
      or new.round
        is distinct from old.round
      or new.stadium
        is distinct from old.stadium
      or new.starts_at
        is distinct from old.starts_at
      or new.status
        is distinct from old.status
      or new.official_home_score
        is distinct from
          old.official_home_score
      or new.official_away_score
        is distinct from
          old.official_away_score
      or new.elapsed_minutes
        is distinct from
          old.elapsed_minutes
      or new.home_team_name
        is distinct from
          old.home_team_name
      or new.home_team_abbreviation
        is distinct from
          old.home_team_abbreviation
      or new.away_team_name
        is distinct from
          old.away_team_name
      or new.away_team_abbreviation
        is distinct from
          old.away_team_abbreviation
    )
  then
    new.automatic_sync_enabled := false;
    new.manual_override_at := now();
    new.manual_override_by := auth.uid();
  end if;

  return new;
end;
$function$;


drop trigger if exists
  mark_manual_match_override_trigger
on public.matches;

create trigger
  mark_manual_match_override_trigger
before update on public.matches
for each row
execute function
  public.mark_manual_match_override();


create or replace function
  public.set_match_automatic_sync(
    target_match_id text,
    enabled_value boolean
  )
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_provider text;
begin
  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not public.is_application_admin() then
    raise exception
      'Você não possui permissão de administrador.';
  end if;

  select provider
  into selected_provider
  from public.matches
  where id = target_match_id;

  if not found then
    raise exception
      'Partida não encontrada.';
  end if;

  if
    enabled_value = true
    and selected_provider = 'manual'
  then
    raise exception
      'Partidas manuais não possuem sincronização automática.';
  end if;

  update public.matches
  set
    automatic_sync_enabled =
      enabled_value,

    manual_override_at =
      case
        when enabled_value
          then null
        else now()
      end,

    manual_override_by =
      case
        when enabled_value
          then null
        else auth.uid()
      end,

    updated_at = now()

  where id = target_match_id;
end;
$function$;

revoke all
on function
  public.set_match_automatic_sync(
    text,
    boolean
  )
from public;

grant execute
on function
  public.set_match_automatic_sync(
    text,
    boolean
  )
to authenticated;


create or replace function
  public.sync_api_football_matches(
    matches_payload jsonb
  )
returns table (
  processed_count integer,
  inserted_count integer,
  updated_count integer,
  synchronized_pool_count integer
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  current_user_id uuid;
  authenticated_role text;

  match_item jsonb;

  selected_match_id text;
  selected_provider text;
  selected_provider_match_id text;
  selected_competition text;
  selected_round integer;
  selected_stadium text;
  selected_starts_at
    timestamp with time zone;
  selected_status text;

  selected_home_score integer;
  selected_away_score integer;
  selected_elapsed_minutes integer;

  selected_home_name text;
  selected_home_abbreviation text;
  selected_home_color text;
  selected_home_logo_url text;

  selected_away_name text;
  selected_away_abbreviation text;
  selected_away_color text;
  selected_away_logo_url text;

  match_already_exists boolean;
  existing_sync_enabled boolean;
  synchronized_for_match integer;

  total_processed integer := 0;
  total_inserted integer := 0;
  total_updated integer := 0;
  total_synchronized_pools integer := 0;
begin
  current_user_id := auth.uid();
  authenticated_role := auth.role();

  /*
   * Sincronizações podem ser executadas:
   * 1. por administrador autenticado;
   * 2. pelo serviço automático protegido.
   */
  if authenticated_role <> 'service_role' then
    if current_user_id is null then
      raise exception
        'É necessário estar autenticado.';
    end if;

    if not public.is_application_admin() then
      raise exception
        'Somente administradores podem sincronizar partidas.';
    end if;
  end if;

  if
    matches_payload is null
    or jsonb_typeof(matches_payload) <> 'array'
  then
    raise exception
      'A lista de partidas é inválida.';
  end if;

  for match_item in
    select value
    from jsonb_array_elements(
      matches_payload
    )
  loop
    selected_match_id :=
      nullif(
        trim(match_item ->> 'id'),
        ''
      );

    selected_provider :=
      coalesce(
        nullif(
          trim(
            match_item ->> 'provider'
          ),
          ''
        ),
        'api-futebol'
      );

    selected_provider_match_id :=
      nullif(
        trim(
          match_item
            ->> 'provider_match_id'
        ),
        ''
      );

    selected_competition :=
      nullif(
        trim(
          match_item ->> 'competition'
        ),
        ''
      );

    selected_round :=
      nullif(
        match_item ->> 'round',
        ''
      )::integer;

    selected_stadium :=
      nullif(
        trim(
          match_item ->> 'stadium'
        ),
        ''
      );

    selected_starts_at :=
      nullif(
        match_item ->> 'starts_at',
        ''
      )::timestamp with time zone;

    selected_status :=
      upper(
        trim(
          match_item ->> 'status'
        )
      );

    selected_home_score :=
      nullif(
        match_item ->> 'home_score',
        ''
      )::integer;

    selected_away_score :=
      nullif(
        match_item ->> 'away_score',
        ''
      )::integer;

    selected_elapsed_minutes :=
      nullif(
        match_item
          ->> 'elapsed_minutes',
        ''
      )::integer;

    selected_home_name :=
      nullif(
        trim(
          match_item
            ->> 'home_team_name'
        ),
        ''
      );

    selected_home_abbreviation :=
      upper(
        nullif(
          trim(
            match_item
              ->> 'home_team_abbreviation'
          ),
          ''
        )
      );

    selected_home_color :=
      coalesce(
        nullif(
          trim(
            match_item
              ->> 'home_team_color'
          ),
          ''
        ),
        '#334155'
      );

    selected_home_logo_url :=
      nullif(
        trim(
          match_item
            ->> 'home_team_logo_url'
        ),
        ''
      );

    selected_away_name :=
      nullif(
        trim(
          match_item
            ->> 'away_team_name'
        ),
        ''
      );

    selected_away_abbreviation :=
      upper(
        nullif(
          trim(
            match_item
              ->> 'away_team_abbreviation'
          ),
          ''
        )
      );

    selected_away_color :=
      coalesce(
        nullif(
          trim(
            match_item
              ->> 'away_team_color'
          ),
          ''
        ),
        '#334155'
      );

    selected_away_logo_url :=
      nullif(
        trim(
          match_item
            ->> 'away_team_logo_url'
        ),
        ''
      );

    if
      selected_match_id is null
      or selected_provider_match_id
        is null
      or selected_competition is null
      or selected_round is null
      or selected_round < 1
      or selected_starts_at is null
      or selected_status is null
      or selected_home_name is null
      or selected_home_abbreviation
        is null
      or selected_away_name is null
      or selected_away_abbreviation
        is null
    then
      raise exception
        'Uma partida contém dados obrigatórios inválidos.';
    end if;

    if selected_status not in (
      'SCHEDULED',
      'OPEN',
      'LIVE',
      'HALFTIME',
      'FINISHED',
      'POSTPONED',
      'CANCELLED'
    ) then
      raise exception
        'Status inválido para a partida %.',
        selected_match_id;
    end if;

    if
      selected_home_score is not null
      and (
        selected_home_score < 0
        or selected_home_score > 99
      )
    then
      raise exception
        'Placar do mandante inválido.';
    end if;

    if
      selected_away_score is not null
      and (
        selected_away_score < 0
        or selected_away_score > 99
      )
    then
      raise exception
        'Placar do visitante inválido.';
    end if;

    select
      true,
      automatic_sync_enabled
    into
      match_already_exists,
      existing_sync_enabled
    from public.matches
    where id = selected_match_id;

    if not found then
      match_already_exists := false;
      existing_sync_enabled := true;
    end if;

    total_processed :=
      total_processed + 1;

    /*
     * A partida está protegida por uma
     * intervenção manual. A API não altera
     * matches nem pool_matches.
     */
    if
      match_already_exists
      and not existing_sync_enabled
    then
      continue;
    end if;

    insert into public.matches (
      id,
      provider,
      provider_match_id,
      competition,
      round,
      stadium,
      starts_at,
      status,
      official_home_score,
      official_away_score,
      elapsed_minutes,
      home_team_name,
      home_team_abbreviation,
      home_team_color,
      home_team_logo_url,
      away_team_name,
      away_team_abbreviation,
      away_team_color,
      away_team_logo_url,
      automatic_sync_enabled,
      manual_override_at,
      manual_override_by,
      updated_at,
      last_synced_at
    )
    values (
      selected_match_id,
      selected_provider,
      selected_provider_match_id,
      selected_competition,
      selected_round,
      selected_stadium,
      selected_starts_at,
      selected_status,
      selected_home_score,
      selected_away_score,
      selected_elapsed_minutes,
      selected_home_name,
      selected_home_abbreviation,
      selected_home_color,
      selected_home_logo_url,
      selected_away_name,
      selected_away_abbreviation,
      selected_away_color,
      selected_away_logo_url,
      true,
      null,
      null,
      now(),
      now()
    )
    on conflict (id)
    do update set
      provider =
        excluded.provider,
      provider_match_id =
        excluded.provider_match_id,
      competition =
        excluded.competition,
      round =
        excluded.round,
      stadium =
        excluded.stadium,
      starts_at =
        excluded.starts_at,
      status =
        excluded.status,
      official_home_score =
        excluded.official_home_score,
      official_away_score =
        excluded.official_away_score,
      elapsed_minutes =
        excluded.elapsed_minutes,
      home_team_name =
        excluded.home_team_name,
      home_team_abbreviation =
        excluded.home_team_abbreviation,
      home_team_color =
        excluded.home_team_color,
      home_team_logo_url =
        excluded.home_team_logo_url,
      away_team_name =
        excluded.away_team_name,
      away_team_abbreviation =
        excluded.away_team_abbreviation,
      away_team_color =
        excluded.away_team_color,
      away_team_logo_url =
        excluded.away_team_logo_url,
      automatic_sync_enabled = true,
      manual_override_at = null,
      manual_override_by = null,
      updated_at = now(),
      last_synced_at = now();

    if match_already_exists then
      total_updated :=
        total_updated + 1;
    else
      total_inserted :=
        total_inserted + 1;
    end if;

    insert into public.pool_matches (
      pool_id,
      match_id,
      status,
      official_home_score,
      official_away_score,
      updated_at
    )
    select
      pool.id,
      selected_match_id,
      selected_status,
      selected_home_score,
      selected_away_score,
      now()
    from public.pools as pool
    where
      pool.competition =
        selected_competition
    on conflict (
      pool_id,
      match_id
    )
    do update set
      status =
        excluded.status,
      official_home_score =
        excluded.official_home_score,
      official_away_score =
        excluded.official_away_score,
      updated_at = now();

    get diagnostics
      synchronized_for_match =
        row_count;

    total_synchronized_pools :=
      total_synchronized_pools +
      synchronized_for_match;
  end loop;

  return query
  select
    total_processed,
    total_inserted,
    total_updated,
    total_synchronized_pools;
end;
$function$;

revoke all
on function
  public.sync_api_football_matches(jsonb)
from public;

grant execute
on function
  public.sync_api_football_matches(jsonb)
to authenticated, service_role;