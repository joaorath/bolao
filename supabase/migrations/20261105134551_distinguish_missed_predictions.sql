create or replace function
  public.get_pool_member_prediction_history(
    target_pool_id uuid,
    target_user_id uuid
  )
returns table(
  user_id uuid,
  user_name text,
  match_id text,
  competition text,
  round integer,
  starts_at timestamp with time zone,
  match_status text,
  home_team_name text,
  home_team_abbreviation text,
  away_team_name text,
  away_team_abbreviation text,
  prediction_home_score integer,
  prediction_away_score integer,
  official_home_score integer,
  official_away_score integer,
  prediction_result text,
  prediction_points integer,
  is_provisional boolean
)
language sql
stable
security definer
set search_path to ''
as $function$
  with authorized_pool as (
    select
      selected_pool.id
    from public.pools
      as selected_pool
    where
      selected_pool.id =
        target_pool_id
      and (
        selected_pool.is_global
        or exists (
          select 1
          from public.pool_members
            as requester_membership
          where
            requester_membership.pool_id =
              selected_pool.id
            and requester_membership.user_id =
              auth.uid()
        )
      )
  ),
  target_member as (
    select
      membership.user_id,
      coalesce(
        nullif(
          trim(profile.username),
          ''
        ),
        profile.full_name
      ) as user_name
    from public.pool_members
      as membership
    join public.profiles
      as profile
      on profile.id =
        membership.user_id
    where
      membership.pool_id =
        target_pool_id
      and membership.user_id =
        target_user_id
      and exists (
        select 1
        from authorized_pool
      )
  ),
  visible_matches as (
    select
      member.user_id,
      member.user_name,
      match_record.id
        as match_id,
      match_record.competition,
      match_record.round,
      match_record.starts_at,
      pool_match.status
        as match_status,
      match_record.home_team_name,
      match_record
        .home_team_abbreviation,
      match_record.away_team_name,
      match_record
        .away_team_abbreviation,

      coalesce(
        prediction.home_score,
        0
      ) as prediction_home_score,

      coalesce(
        prediction.away_score,
        0
      ) as prediction_away_score,

      pool_match.official_home_score,
      pool_match.official_away_score,

      prediction.user_id is not null
        as has_prediction

    from target_member
      as member

    join public.pool_matches
      as pool_match
      on pool_match.pool_id =
        target_pool_id

    join public.matches
      as match_record
      on match_record.id =
        pool_match.match_id

    left join public.predictions
      as prediction
      on prediction.pool_id =
        target_pool_id
      and prediction.match_id =
        pool_match.match_id
      and prediction.user_id =
        member.user_id

    where
      pool_match.status in (
        'LIVE',
        'HALFTIME',
        'FINISHED'
      )
      and match_record.starts_at <=
        now()
  )
  select
    visible.user_id,
    visible.user_name,
    visible.match_id,
    visible.competition,
    visible.round,
    visible.starts_at,
    visible.match_status,
    visible.home_team_name,
    visible.home_team_abbreviation,
    visible.away_team_name,
    visible.away_team_abbreviation,
    visible.prediction_home_score,
    visible.prediction_away_score,
    visible.official_home_score,
    visible.official_away_score,

    case
      when not visible.has_prediction
      then 'MISSED'

      when
        visible.official_home_score
          is null
        or visible.official_away_score
          is null
      then 'PENDING'

      when
        visible.prediction_home_score =
          visible.official_home_score
        and
        visible.prediction_away_score =
          visible.official_away_score
      then 'EXACT'

      when
        sign(
          visible.prediction_home_score -
          visible.prediction_away_score
        ) =
        sign(
          visible.official_home_score -
          visible.official_away_score
        )
      then 'RESULT'

      else 'WRONG'
    end as prediction_result,

    case
      when not visible.has_prediction
      then 0

      when
        visible.official_home_score
          is null
        or visible.official_away_score
          is null
      then 0

      when
        visible.prediction_home_score =
          visible.official_home_score
        and
        visible.prediction_away_score =
          visible.official_away_score
      then 5

      when
        sign(
          visible.prediction_home_score -
          visible.prediction_away_score
        ) =
        sign(
          visible.official_home_score -
          visible.official_away_score
        )
      then 3

      else 0
    end as prediction_points,

    visible.match_status in (
      'LIVE',
      'HALFTIME'
    ) as is_provisional

  from visible_matches
    as visible

  order by
    visible.starts_at desc;
$function$;