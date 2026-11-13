SET local check_function_bodies = off;

CREATE TABLE "public"."admin_audit_logs" (
  "id"            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "actor_user_id" uuid,
  "action"        text                     NOT NULL,
  "entity_type"   text                     NOT NULL DEFAULT 'MATCH'::text,
  "entity_id"     text                     NOT NULL,
  "old_data"      jsonb,
  "new_data"      jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."admin_audit_logs"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."admin_audit_logs" FROM "anon";

CREATE TABLE "public"."matches" (
  "id"                     text                     NOT NULL,
  "competition"            text                     NOT NULL,
  "round"                  integer                  NOT NULL,
  "stadium"                text,
  "starts_at"              timestamp with time zone NOT NULL,
  "status"                 text                     NOT NULL DEFAULT 'OPEN'::text,
  "home_team_name"         text                     NOT NULL,
  "home_team_abbreviation" text                     NOT NULL,
  "home_team_color"        text                     NOT NULL,
  "away_team_name"         text                     NOT NULL,
  "away_team_abbreviation" text                     NOT NULL,
  "away_team_color"        text                     NOT NULL,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "official_home_score"    integer,
  "official_away_score"    integer,
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "matches_official_away_score_check" CHECK (((official_away_score IS NULL) OR (official_away_score >= 0))),
  CONSTRAINT "matches_official_home_score_check" CHECK (((official_home_score IS NULL) OR (official_home_score >= 0))),
  CONSTRAINT "matches_pkey" PRIMARY KEY (id),
  CONSTRAINT "matches_status_check"
    CHECK ((status = ANY (ARRAY['SCHEDULED'::text, 'OPEN'::text, 'LIVE'::text, 'HALFTIME'::text, 'FINISHED'::text, 'POSTPONED'::text, 'CANCELLED'::text])))
);

ALTER TABLE "public"."matches"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."matches" FROM "anon";

CREATE TABLE "public"."pool_matches" (
  "pool_id"             uuid                     NOT NULL,
  "match_id"            text                     NOT NULL,
  "status"              text                     NOT NULL DEFAULT 'OPEN'::text,
  "official_home_score" integer,
  "official_away_score" integer,
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "pool_matches_official_away_score_check" CHECK ((official_away_score >= 0)),
  CONSTRAINT "pool_matches_official_home_score_check" CHECK ((official_home_score >= 0)),
  CONSTRAINT "pool_matches_pkey" PRIMARY KEY (pool_id, match_id),
  CONSTRAINT "pool_matches_status_check"
    CHECK ((status = ANY (ARRAY['SCHEDULED'::text, 'OPEN'::text, 'LIVE'::text, 'HALFTIME'::text, 'FINISHED'::text, 'POSTPONED'::text, 'CANCELLED'::text])))
);

ALTER TABLE "public"."pool_matches"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."pool_matches" FROM "anon";

CREATE TABLE "public"."pool_members" (
  "pool_id"   uuid                     NOT NULL,
  "user_id"   uuid                     NOT NULL,
  "role"      text                     NOT NULL DEFAULT 'MEMBER'::text,
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "pool_members_pkey" PRIMARY KEY (pool_id, user_id),
  CONSTRAINT "pool_members_role_check" CHECK ((role = ANY (ARRAY['OWNER'::text, 'MEMBER'::text])))
);

ALTER TABLE "public"."pool_members"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."pool_members" FROM "anon";

CREATE TABLE "public"."pools" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"    uuid,
  "name"        text                     NOT NULL,
  "description" text                     NOT NULL DEFAULT ''::text,
  "competition" text                     NOT NULL,
  "visibility"  text                     NOT NULL DEFAULT 'PRIVATE'::text,
  "invite_code" text                     NOT NULL DEFAULT upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 8)),
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "is_global"   boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "pools_invite_code_key" UNIQUE (invite_code),
  CONSTRAINT "pools_name_check" CHECK (((char_length(name) >= 3) AND (char_length(name) <= 80))),
  CONSTRAINT "pools_owner_global_check" CHECK ((((is_global = true) AND (owner_id IS NULL)) OR ((is_global = false) AND (owner_id IS NOT NULL)))),
  CONSTRAINT "pools_pkey" PRIMARY KEY (id),
  CONSTRAINT "pools_visibility_check" CHECK ((visibility = ANY (ARRAY['PUBLIC'::text, 'PRIVATE'::text])))
);

ALTER TABLE "public"."pools"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."pools" FROM "anon";

CREATE TABLE "public"."predictions" (
  "pool_id"    uuid                     NOT NULL,
  "match_id"   text                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "home_score" integer                  NOT NULL,
  "away_score" integer                  NOT NULL,
  "saved_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "predictions_away_score_check" CHECK ((away_score >= 0)),
  CONSTRAINT "predictions_home_score_check" CHECK ((home_score >= 0)),
  CONSTRAINT "predictions_pkey" PRIMARY KEY (pool_id, match_id, user_id)
);

ALTER TABLE "public"."predictions"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."predictions" FROM "anon";

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "full_name"  text                     NOT NULL DEFAULT 'Participante'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_admin"   boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

CREATE OR REPLACE FUNCTION public.create_official_match (
  competition_value            text,
  round_value                  integer,
  stadium_value                text,
  starts_at_value              timestamp with time zone,
  home_team_name_value         text,
  home_team_abbreviation_value text,
  home_team_color_value        text,
  away_team_name_value         text,
  away_team_abbreviation_value text,
  away_team_color_value        text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_user_id uuid;
  created_match_id text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and is_admin = true
  ) then
    raise exception
      'Você não possui permissão de administrador.';
  end if;

  if trim(competition_value) = '' then
    raise exception
      'Informe a competição.';
  end if;

  if round_value is null or round_value < 1 then
    raise exception
      'Informe uma rodada válida.';
  end if;

  if starts_at_value is null then
    raise exception
      'Informe a data e o horário da partida.';
  end if;

  if trim(home_team_name_value) = '' then
    raise exception
      'Informe o time mandante.';
  end if;

  if trim(away_team_name_value) = '' then
    raise exception
      'Informe o time visitante.';
  end if;

  if upper(trim(home_team_name_value)) =
     upper(trim(away_team_name_value)) then
    raise exception
      'Os times da partida devem ser diferentes.';
  end if;

  if char_length(
    trim(home_team_abbreviation_value)
  ) not between 2 and 5 then
    raise exception
      'A sigla do mandante deve ter entre 2 e 5 caracteres.';
  end if;

  if char_length(
    trim(away_team_abbreviation_value)
  ) not between 2 and 5 then
    raise exception
      'A sigla do visitante deve ter entre 2 e 5 caracteres.';
  end if;

  if exists (
    select 1
    from public.matches
    where
      competition =
        trim(competition_value)
      and starts_at =
        starts_at_value
      and upper(home_team_name) =
        upper(trim(home_team_name_value))
      and upper(away_team_name) =
        upper(trim(away_team_name_value))
  ) then
    raise exception
      'Esta partida já está cadastrada.';
  end if;

  created_match_id :=
    gen_random_uuid()::text;

  insert into public.matches (
    id,
    competition,
    round,
    stadium,
    starts_at,
    status,
    official_home_score,
    official_away_score,
    home_team_name,
    home_team_abbreviation,
    home_team_color,
    away_team_name,
    away_team_abbreviation,
    away_team_color,
    updated_at
  )
  values (
    created_match_id,
    trim(competition_value),
    round_value,
    nullif(trim(stadium_value), ''),
    starts_at_value,
    'OPEN',
    null,
    null,
    trim(home_team_name_value),
    upper(
      trim(
        home_team_abbreviation_value
      )
    ),
    coalesce(
      nullif(
        trim(home_team_color_value),
        ''
      ),
      '#334155'
    ),
    trim(away_team_name_value),
    upper(
      trim(
        away_team_abbreviation_value
      )
    ),
    coalesce(
      nullif(
        trim(away_team_color_value),
        ''
      ),
      '#334155'
    ),
    now()
  );

  return created_match_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_prediction_lock()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  selected_pool_id uuid;
  selected_match_id text;
  selected_user_id uuid;
  selected_status text;
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

  select pool_match.status
  into selected_status
  from public.pool_matches as pool_match
  where
    pool_match.pool_id = selected_pool_id
    and pool_match.match_id =
      selected_match_id;

  if selected_status is null then
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

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_audit_logs (
  result_limit  integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
  RETURNS TABLE (
    log_id           bigint,
    actor_user_id    uuid,
    actor_name       text,
    action_name      text,
    match_id         text,
    home_team_name   text,
    away_team_name   text,
    previous_status  text,
    new_status       text,
    event_created_at timestamp with time zone
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where
      profiles.id = auth.uid()
      and profiles.is_admin = true
  ) then
    raise exception
      'Você não possui permissão de administrador.';
  end if;

  return query
  select
    audit.id
      as log_id,

    audit.actor_user_id,

    coalesce(
      profile.full_name,
      case
        when audit.actor_user_id is null
          then 'Sistema automático'
        else 'Administrador'
      end
    ) as actor_name,

    audit.action
      as action_name,

    audit.entity_id
      as match_id,

    coalesce(
      audit.new_data
        ->> 'home_team_name',
      audit.old_data
        ->> 'home_team_name',
      'Time mandante'
    ) as home_team_name,

    coalesce(
      audit.new_data
        ->> 'away_team_name',
      audit.old_data
        ->> 'away_team_name',
      'Time visitante'
    ) as away_team_name,

    audit.old_data
      ->> 'status'
      as previous_status,

    audit.new_data
      ->> 'status'
      as new_status,

    audit.created_at
      as event_created_at

  from public.admin_audit_logs
    as audit

  left join public.profiles
    as profile
    on profile.id =
      audit.actor_user_id

  order by
    audit.created_at desc,
    audit.id desc

  limit least(
    greatest(
      coalesce(result_limit, 50),
      1
    ),
    200
  )

  offset greatest(
    coalesce(result_offset, 0),
    0
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_pool_ranking (
  target_pool_id uuid
)
  RETURNS TABLE (
    user_id           uuid,
    user_name         text,
    "position"        bigint,
    points            bigint,
    exact_scores      bigint,
    correct_results   bigint,
    wrong_predictions bigint
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with authorized_pool as (
    select target_pool_id as pool_id
    where exists (
      select 1
      from public.pool_members
        as authorization_member
      where
        authorization_member.pool_id =
          target_pool_id
        and authorization_member.user_id =
          auth.uid()
    )
  ),

  scores as (
    select
      members.user_id
        as ranking_user_id,

      coalesce(
        profiles.full_name,
        'Participante'
      ) as ranking_user_name,

      coalesce(
        sum(
          case
            when
              games.status = 'FINISHED'
              and predictions.match_id
                is not null
              and games.official_home_score
                is not null
              and games.official_away_score
                is not null
              and predictions.home_score =
                games.official_home_score
              and predictions.away_score =
                games.official_away_score
            then 5

            when
              games.status = 'FINISHED'
              and predictions.match_id
                is not null
              and games.official_home_score
                is not null
              and games.official_away_score
                is not null
              and sign(
                predictions.home_score -
                predictions.away_score
              ) = sign(
                games.official_home_score -
                games.official_away_score
              )
            then 3

            else 0
          end
        ),
        0
      )::bigint as total_points,

      coalesce(
        sum(
          case
            when
              games.status = 'FINISHED'
              and predictions.match_id
                is not null
              and predictions.home_score =
                games.official_home_score
              and predictions.away_score =
                games.official_away_score
            then 1
            else 0
          end
        ),
        0
      )::bigint as total_exact_scores,

      coalesce(
        sum(
          case
            when
              games.status = 'FINISHED'
              and predictions.match_id
                is not null
              and games.official_home_score
                is not null
              and games.official_away_score
                is not null
              and sign(
                predictions.home_score -
                predictions.away_score
              ) = sign(
                games.official_home_score -
                games.official_away_score
              )
            then 1
            else 0
          end
        ),
        0
      )::bigint as total_correct_results,

      coalesce(
        sum(
          case
            when
              games.status = 'FINISHED'
              and predictions.match_id
                is not null
              and games.official_home_score
                is not null
              and games.official_away_score
                is not null
              and sign(
                predictions.home_score -
                predictions.away_score
              ) <> sign(
                games.official_home_score -
                games.official_away_score
              )
            then 1
            else 0
          end
        ),
        0
      )::bigint as total_wrong_predictions

    from authorized_pool

    join public.pool_members as members
      on members.pool_id =
        authorized_pool.pool_id

    join public.profiles as profiles
      on profiles.id =
        members.user_id

    left join public.predictions
      as predictions
      on predictions.pool_id =
        members.pool_id
      and predictions.user_id =
        members.user_id

    left join public.pool_matches as games
      on games.pool_id =
        members.pool_id
      and games.match_id =
        predictions.match_id

    group by
      members.user_id,
      profiles.full_name
  ),

  ranked as (
    select
      scores.*,

      dense_rank() over (
        order by
          scores.total_points desc,
          scores.total_exact_scores desc,
          scores.total_correct_results desc
      ) as ranking_position

    from scores
  )

  select
    ranked.ranking_user_id,
    ranked.ranking_user_name,
    ranked.ranking_position,
    ranked.total_points,
    ranked.total_exact_scores,
    ranked.total_correct_results,
    ranked.total_wrong_predictions

  from ranked

  order by
    ranked.ranking_position,
    ranked.ranking_user_name;
$function$;

CREATE OR REPLACE FUNCTION public.get_pool_ranking_summary (
  target_pool_id uuid,
  ranking_limit  integer DEFAULT 100
)
  RETURNS TABLE (
    user_id            uuid,
    user_name          text,
    ranking_position   bigint,
    points             bigint,
    exact_scores       bigint,
    correct_results    bigint,
    wrong_predictions  bigint,
    total_participants bigint,
    is_current_user    boolean,
    is_top_entry       boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with complete_ranking as (
    select
      ranking.user_id,
      ranking.user_name,
      ranking."position" as ranking_position,
      ranking.points,
      ranking.exact_scores,
      ranking.correct_results,
      ranking.wrong_predictions,
      count(*) over ()::bigint
        as total_participants
    from public.get_pool_ranking(
      target_pool_id
    ) as ranking
  ),

  configured_ranking as (
    select
      complete_ranking.*,
      greatest(
        1,
        least(
          coalesce(ranking_limit, 100),
          100
        )
      )::bigint as visible_limit
    from complete_ranking
  )

  select
    configured_ranking.user_id,
    configured_ranking.user_name,
    configured_ranking.ranking_position,
    configured_ranking.points,
    configured_ranking.exact_scores,
    configured_ranking.correct_results,
    configured_ranking.wrong_predictions,
    configured_ranking.total_participants,

    configured_ranking.user_id =
      auth.uid()
      as is_current_user,

    configured_ranking.ranking_position <=
      configured_ranking.visible_limit
      as is_top_entry

  from configured_ranking

  where
    configured_ranking.ranking_position <=
      configured_ranking.visible_limit
    or configured_ranking.user_id =
      auth.uid()

  order by
    case
      when configured_ranking.ranking_position <=
        configured_ranking.visible_limit
      then 0
      else 1
    end,
    configured_ranking.ranking_position,
    configured_ranking.user_name;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_match()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.pool_matches (
    pool_id,
    match_id,
    status,
    official_home_score,
    official_away_score
  )
  select
    pool_record.id,
    new.id,
    new.status,
    new.official_home_score,
    new.official_away_score
  from public.pools as pool_record
  where
    pool_record.competition =
      new.competition
  on conflict (pool_id, match_id)
  do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_pool()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.owner_id is not null then
    insert into public.pool_members (
      pool_id,
      user_id,
      role
    )
    values (
      new.id,
      new.owner_id,
      'OWNER'
    )
    on conflict (pool_id, user_id)
    do nothing;
  end if;

  insert into public.pool_matches (
    pool_id,
    match_id,
    status,
    official_home_score,
    official_away_score
  )
  select
    new.id,
    match_record.id,
    match_record.status,
    match_record.official_home_score,
    match_record.official_away_score
  from public.matches as match_record
  where
    match_record.competition =
      new.competition
  on conflict (pool_id, match_id)
  do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    coalesce(
      nullif(
        trim(
          new.raw_user_meta_data ->> 'full_name'
        ),
        ''
      ),
      'Participante'
    )
  )
  on conflict (id)
  do nothing;

  insert into public.pool_members (
    pool_id,
    user_id,
    role
  )
  select
    global_pool.id,
    new.id,
    'MEMBER'
  from public.pools as global_pool
  where global_pool.is_global = true
  on conflict (pool_id, user_id)
  do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_application_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_global_pool (
  target_pool_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.pools
    where id = target_pool_id
      and is_global = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_pool_member (
  target_pool_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.pool_members
    where pool_id = target_pool_id
      and user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_pool_owner (
  target_pool_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.pools
    where id = target_pool_id
      and owner_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.join_pool_by_code (
  provided_code text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  selected_pool_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  select id
  into selected_pool_id
  from public.pools
  where invite_code =
        upper(trim(provided_code))
    and is_global = false;

  if selected_pool_id is null then
    raise exception
      'Código de convite não encontrado.';
  end if;

  insert into public.pool_members (
    pool_id,
    user_id,
    role
  )
  values (
    selected_pool_id,
    current_user_id,
    'MEMBER'
  )
  on conflict (pool_id, user_id)
  do nothing;

  return selected_pool_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.log_official_match_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  selected_action text;
begin
  if tg_op = 'INSERT' then
    selected_action :=
      'MATCH_CREATED';

    insert into
      public.admin_audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
      )
    values (
      auth.uid(),
      selected_action,
      'MATCH',
      new.id,
      null,
      to_jsonb(new)
    );

    return new;
  end if;

  if old.status is distinct from new.status then
    selected_action :=
      'MATCH_STATUS_UPDATED';

  elsif
    old.official_home_score
      is distinct from
      new.official_home_score
    or
    old.official_away_score
      is distinct from
      new.official_away_score
  then
    selected_action :=
      'MATCH_SCORE_UPDATED';

  else
    selected_action :=
      'MATCH_DETAILS_UPDATED';
  end if;

  insert into
    public.admin_audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data
    )
  values (
    auth.uid(),
    selected_action,
    'MATCH',
    new.id,
    to_jsonb(old),
    to_jsonb(new)
  );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.save_official_match_result (
  target_match_id  text,
  home_score_value integer,
  away_score_value integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not public.is_application_admin() then
    raise exception
      'Somente administradores podem informar resultados.';
  end if;

  if
    home_score_value is null
    or away_score_value is null
    or home_score_value < 0
    or away_score_value < 0
    or home_score_value > 99
    or away_score_value > 99
  then
    raise exception
      'O placar informado é inválido.';
  end if;

  update public.matches
  set
    official_home_score =
      home_score_value,
    official_away_score =
      away_score_value,
    status = 'FINISHED',
    updated_at = now()
  where id = target_match_id;

  if not found then
    raise exception
      'Partida não encontrada.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_match_result_to_pools()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  update public.pool_matches
  set
    status = new.status,
    official_home_score =
      new.official_home_score,
    official_away_score =
      new.official_away_score,
    updated_at = now()
  where match_id = new.id;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_official_match_details (
  target_match_id              text,
  competition_value            text,
  round_value                  integer,
  stadium_value                text,
  starts_at_value              timestamp with time zone,
  home_team_name_value         text,
  home_team_abbreviation_value text,
  home_team_color_value        text,
  away_team_name_value         text,
  away_team_abbreviation_value text,
  away_team_color_value        text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_user_id uuid;
  current_match_status text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and is_admin = true
  ) then
    raise exception
      'Você não possui permissão de administrador.';
  end if;

  select status
  into current_match_status
  from public.matches
  where id = target_match_id;

  if current_match_status is null then
    raise exception
      'Partida não encontrada.';
  end if;

  if current_match_status in (
    'LIVE',
    'HALFTIME',
    'FINISHED'
  ) then
    raise exception
      'Não é possível editar os dados de uma partida iniciada.';
  end if;

  if trim(competition_value) = '' then
    raise exception
      'Informe a competição.';
  end if;

  if round_value is null or round_value < 1 then
    raise exception
      'Informe uma rodada válida.';
  end if;

  if starts_at_value is null then
    raise exception
      'Informe a data e o horário.';
  end if;

  if trim(home_team_name_value) = '' then
    raise exception
      'Informe o time mandante.';
  end if;

  if trim(away_team_name_value) = '' then
    raise exception
      'Informe o time visitante.';
  end if;

  if upper(trim(home_team_name_value)) =
     upper(trim(away_team_name_value)) then
    raise exception
      'Os times precisam ser diferentes.';
  end if;

  if char_length(
    trim(home_team_abbreviation_value)
  ) not between 2 and 5 then
    raise exception
      'A sigla do mandante deve ter entre 2 e 5 caracteres.';
  end if;

  if char_length(
    trim(away_team_abbreviation_value)
  ) not between 2 and 5 then
    raise exception
      'A sigla do visitante deve ter entre 2 e 5 caracteres.';
  end if;

  if exists (
    select 1
    from public.matches
    where
      id <> target_match_id
      and competition =
        trim(competition_value)
      and starts_at =
        starts_at_value
      and upper(home_team_name) =
        upper(trim(home_team_name_value))
      and upper(away_team_name) =
        upper(trim(away_team_name_value))
  ) then
    raise exception
      'Já existe outra partida com estes dados.';
  end if;

  update public.matches
  set
    competition =
      trim(competition_value),
    round =
      round_value,
    stadium =
      nullif(trim(stadium_value), ''),
    starts_at =
      starts_at_value,
    home_team_name =
      trim(home_team_name_value),
    home_team_abbreviation =
      upper(
        trim(
          home_team_abbreviation_value
        )
      ),
    home_team_color =
      coalesce(
        nullif(
          trim(home_team_color_value),
          ''
        ),
        '#334155'
      ),
    away_team_name =
      trim(away_team_name_value),
    away_team_abbreviation =
      upper(
        trim(
          away_team_abbreviation_value
        )
      ),
    away_team_color =
      coalesce(
        nullif(
          trim(away_team_color_value),
          ''
        ),
        '#334155'
      ),
    updated_at = now()
  where id = target_match_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_official_match_state (
  target_match_id  text,
  new_status       text,
  home_score_value integer DEFAULT NULL::integer,
  away_score_value integer DEFAULT NULL::integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then
    raise exception
      'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception
      'Você não possui permissão de administrador.';
  end if;

  if new_status not in (
    'SCHEDULED',
    'OPEN',
    'LIVE',
    'HALFTIME',
    'FINISHED',
    'POSTPONED',
    'CANCELLED'
  ) then
    raise exception
      'Status de partida inválido.';
  end if;

  if (
    home_score_value is not null
    and (
      home_score_value < 0
      or home_score_value > 99
    )
  ) then
    raise exception
      'Placar do mandante inválido.';
  end if;

  if (
    away_score_value is not null
    and (
      away_score_value < 0
      or away_score_value > 99
    )
  ) then
    raise exception
      'Placar do visitante inválido.';
  end if;

  if new_status in (
    'LIVE',
    'HALFTIME',
    'FINISHED'
  ) and (
    home_score_value is null
    or away_score_value is null
  ) then
    raise exception
      'Informe o placar dos dois times.';
  end if;

  update public.matches
  set
    status = new_status,

    official_home_score =
      case
        when new_status in (
          'SCHEDULED',
          'OPEN',
          'CANCELLED'
        )
          then null

        when new_status = 'POSTPONED'
          then coalesce(
            home_score_value,
            official_home_score
          )

        else home_score_value
      end,

    official_away_score =
      case
        when new_status in (
          'SCHEDULED',
          'OPEN',
          'CANCELLED'
        )
          then null

        when new_status = 'POSTPONED'
          then coalesce(
            away_score_value,
            official_away_score
          )

        else away_score_value
      end,

    updated_at = now()

  where id = target_match_id;

  if not found then
    raise exception
      'Partida não encontrada.';
  end if;
end;
$function$;

ALTER TABLE "public"."pool_matches"
  ADD CONSTRAINT "pool_matches_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

ALTER TABLE "public"."pool_matches"
  ADD CONSTRAINT "pool_matches_pool_id_fkey" FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;

ALTER TABLE "public"."pool_members"
  ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;

ALTER TABLE "public"."predictions"
  ADD CONSTRAINT "predictions_pool_id_match_id_fkey" FOREIGN KEY (pool_id, match_id) REFERENCES public.pool_matches(pool_id, match_id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."pool_members"
  ADD CONSTRAINT "pool_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."pools"
  ADD CONSTRAINT "pools_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."predictions"
  ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX admin_audit_logs_created_at_index ON public.admin_audit_logs USING btree (created_at DESC);

CREATE INDEX admin_audit_logs_entity_index ON public.admin_audit_logs USING btree (entity_type, entity_id);

CREATE UNIQUE INDEX pools_only_one_global_idx ON public.pools USING btree (is_global)
  WHERE (is_global = true);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER add_new_match_to_pools_trigger
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_match();

CREATE TRIGGER register_official_match_change
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_official_match_change();

CREATE TRIGGER sync_match_result_to_pools_trigger
  AFTER UPDATE OF status, official_home_score, official_away_score ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_match_result_to_pools();

CREATE TRIGGER on_pool_created
  AFTER INSERT ON public.pools
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_pool();

CREATE TRIGGER protect_locked_predictions
  BEFORE INSERT OR DELETE OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_prediction_lock();

CREATE TRIGGER set_profile_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_updated_at();

CREATE POLICY "Admins can view audit logs" ON "public"."admin_audit_logs"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));

CREATE POLICY "Authenticated users can view matches" ON "public"."matches"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Members can view pool matches" ON "public"."pool_matches"
  FOR SELECT
  TO "authenticated"
  USING (public.is_pool_member(pool_id));

CREATE POLICY "Members can leave pools" ON "public"."pool_members"
  FOR DELETE
  TO "authenticated"
  USING (((user_id = auth.uid()) AND (NOT public.is_global_pool(pool_id))));

CREATE POLICY "Members can view pool members" ON "public"."pool_members"
  FOR SELECT
  TO "authenticated"
  USING (public.is_pool_member(pool_id));

CREATE POLICY "Members can view their pools" ON "public"."pools"
  FOR SELECT
  TO "authenticated"
  USING (((owner_id = ( SELECT auth.uid() AS uid)) OR public.is_pool_member(id)));

CREATE POLICY "Owners can delete pools" ON "public"."pools"
  FOR DELETE
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can update pools" ON "public"."pools"
  FOR UPDATE
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can create pools" ON "public"."pools"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can create predictions" ON "public"."predictions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND public.is_pool_member(pool_id)));

CREATE POLICY "Users can delete their predictions" ON "public"."predictions"
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND public.is_pool_member(pool_id)));

CREATE POLICY "Users can update their predictions" ON "public"."predictions"
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND public.is_pool_member(pool_id)))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND public.is_pool_member(pool_id)));

CREATE POLICY "Users can view their predictions" ON "public"."predictions"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND public.is_pool_member(pool_id)));

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "Users can view their own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

REVOKE ALL ON FUNCTION "public"."create_official_match"(text, integer, text, timestamp WITH time zone, text, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."create_official_match"(text, integer, text, timestamp WITH time zone, text, text, text, text, text, text)
  TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."enforce_prediction_lock"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_admin_audit_logs"(integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_admin_audit_logs"(integer, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_pool_ranking"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_pool_ranking"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_pool_ranking_summary"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_pool_ranking_summary"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_match"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_pool"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_application_admin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_application_admin"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_global_pool"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_pool_member"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_pool_member"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_pool_owner"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_pool_owner"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."join_pool_by_code"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."join_pool_by_code"(text) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."log_official_match_change"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."save_official_match_result"(text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."save_official_match_result"(text, integer, integer) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_profile_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."sync_match_result_to_pools"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_official_match_details"(text, text, integer, text, timestamp WITH time zone, text, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."update_official_match_details"(text, text, integer, text, timestamp WITH time zone, text, text, text, text, text, text)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_official_match_state"(text, text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_official_match_state"(text, text, integer, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."admin_audit_logs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."admin_audit_logs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admin_audit_logs" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pool_matches" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pool_members" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pools" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."predictions" TO "authenticated", "postgres", "service_role";

REVOKE ALL ("full_name") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("full_name") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres", "service_role";

