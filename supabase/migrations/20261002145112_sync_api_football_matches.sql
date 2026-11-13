alter table public.matches
  add column if not exists provider
    text not null default 'manual',
  add column if not exists provider_match_id
    text,
  add column if not exists home_team_logo_url
    text,
  add column if not exists away_team_logo_url
    text,
  add column if not exists elapsed_minutes
    integer,
  add column if not exists last_synced_at
    timestamp with time zone;

alter table public.matches
  drop constraint if exists
    matches_elapsed_minutes_check;

alter table public.matches
  add constraint
    matches_elapsed_minutes_check
  check (
    elapsed_minutes is null
    or elapsed_minutes between 0 and 200
  );

create unique index if not exists
  matches_provider_external_id_key
on public.matches (
  provider,
  provider_match_id
)
where provider_match_id is not null;

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
  synchronized_for_match integer;

  total_processed integer := 0;
  total_inserted integer := 0;
  total_updated integer := 0;
  total_synchronized_pools integer := 0;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not public.is_application_admin() then
    raise exception
      'Somente administradores podem sincronizar partidas.';
  end if;

  if matches_payload is null
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

    if selected_match_id is null
       or selected_provider_match_id is null
       or selected_competition is null
       or selected_round is null
       or selected_round < 1
       or selected_starts_at is null
       or selected_status is null
       or selected_home_name is null
       or selected_home_abbreviation is null
       or selected_away_name is null
       or selected_away_abbreviation is null
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

    if selected_home_score is not null
       and selected_home_score < 0
    then
      raise exception
        'Placar do mandante inválido.';
    end if;

    if selected_away_score is not null
       and selected_away_score < 0
    then
      raise exception
        'Placar do visitante inválido.';
    end if;

    select exists (
      select 1
      from public.matches
      where id = selected_match_id
    )
    into match_already_exists;

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
      updated_at = now(),
      last_synced_at = now();

    total_processed :=
      total_processed + 1;

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