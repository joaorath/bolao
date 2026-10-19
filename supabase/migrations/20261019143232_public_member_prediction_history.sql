create or replace function
  public.get_pool_member_prediction_history(
    target_pool_id uuid,
    target_user_id uuid
  )
returns table (
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
    from public.pools as selected_pool
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
  visible_predictions as (
    select
      prediction.user_id,
      coalesce(
        nullif(
          trim(profile.username),
          ''
        ),
        profile.full_name
      ) as user_name,
      match.id as match_id,
      match.competition,
      match.round,
      match.starts_at,
      pool_match.status
        as match_status,
      match.home_team_name,
      match.home_team_abbreviation,
      match.away_team_name,
      match.away_team_abbreviation,
      prediction.home_score
        as prediction_home_score,
      prediction.away_score
        as prediction_away_score,
      pool_match.official_home_score,
      pool_match.official_away_score
    from public.predictions
      as prediction
    join public.pool_matches
      as pool_match
      on pool_match.pool_id =
        prediction.pool_id
      and pool_match.match_id =
        prediction.match_id
    join public.matches
      as match
      on match.id =
        prediction.match_id
    join public.profiles
      as profile
      on profile.id =
        prediction.user_id
    where
      prediction.pool_id =
        target_pool_id
      and prediction.user_id =
        target_user_id
      and exists (
        select 1
        from authorized_pool
      )
      and exists (
        select 1
        from public.pool_members
          as target_membership
        where
          target_membership.pool_id =
            target_pool_id
          and target_membership.user_id =
            target_user_id
      )
      and pool_match.status in (
        'LIVE',
        'HALFTIME',
        'FINISHED'
      )
      and match.starts_at <= now()
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
  from visible_predictions
    as visible
  order by
    visible.starts_at desc;
$function$;

revoke all
on function
  public.get_pool_member_prediction_history(
    uuid,
    uuid
  )
from public;

grant execute
on function
  public.get_pool_member_prediction_history(
    uuid,
    uuid
  )
to authenticated;


create or replace function
  public.get_pool_live_prediction_deltas(
    target_pool_id uuid
  )
returns table (
  user_id uuid,
  live_points bigint,
  live_exact_scores bigint,
  live_correct_results bigint,
  live_wrong_predictions bigint
)
language sql
stable
security definer
set search_path to ''
as $function$
  with authorized_pool as (
    select
      selected_pool.id
    from public.pools as selected_pool
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
  live_predictions as (
    select
      prediction.user_id,

      case
        when
          pool_match.official_home_score
            is null
          or pool_match.official_away_score
            is null
        then 'PENDING'

        when
          prediction.home_score =
            pool_match.official_home_score
          and
          prediction.away_score =
            pool_match.official_away_score
        then 'EXACT'

        when
          sign(
            prediction.home_score -
            prediction.away_score
          ) =
          sign(
            pool_match.official_home_score -
            pool_match.official_away_score
          )
        then 'RESULT'

        else 'WRONG'
      end as evaluation
    from public.predictions
      as prediction
    join public.pool_matches
      as pool_match
      on pool_match.pool_id =
        prediction.pool_id
      and pool_match.match_id =
        prediction.match_id
    join public.matches
      as match
      on match.id =
        prediction.match_id
    where
      prediction.pool_id =
        target_pool_id
      and exists (
        select 1
        from authorized_pool
      )
      and pool_match.status in (
        'LIVE',
        'HALFTIME'
      )
      and match.starts_at <= now()
  )
  select
    live.user_id,

    coalesce(
      sum(
        case
          when live.evaluation =
            'EXACT'
          then 5
          when live.evaluation =
            'RESULT'
          then 3
          else 0
        end
      ),
      0
    )::bigint as live_points,

    count(*) filter (
      where live.evaluation =
        'EXACT'
    )::bigint
      as live_exact_scores,

    count(*) filter (
      where live.evaluation =
        'RESULT'
    )::bigint
      as live_correct_results,

    count(*) filter (
      where live.evaluation =
        'WRONG'
    )::bigint
      as live_wrong_predictions
  from live_predictions as live
  group by
    live.user_id;
$function$;

revoke all
on function
  public.get_pool_live_prediction_deltas(
    uuid
  )
from public;

grant execute
on function
  public.get_pool_live_prediction_deltas(
    uuid
  )
to authenticated;