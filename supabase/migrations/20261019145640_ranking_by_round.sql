create or replace function
  public.get_pool_available_rounds(
    target_pool_id uuid
  )
returns table (
  round_number integer,
  first_match_at timestamp with time zone,
  has_live_matches boolean,
  has_open_matches boolean
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
      and exists (
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
  select
    match.round
      as round_number,

    min(match.starts_at)
      as first_match_at,

    bool_or(
      pool_match.status in (
        'LIVE',
        'HALFTIME'
      )
    ) as has_live_matches,

    bool_or(
      pool_match.status in (
        'OPEN',
        'SCHEDULED'
      )
    ) as has_open_matches

  from authorized_pool

  join public.pool_matches
    as pool_match
    on pool_match.pool_id =
      authorized_pool.id

  join public.matches
    as match
    on match.id =
      pool_match.match_id

  group by
    match.round

  order by
    match.round desc;
$function$;

revoke all
on function
  public.get_pool_available_rounds(
    uuid
  )
from public;

grant execute
on function
  public.get_pool_available_rounds(
    uuid
  )
to authenticated;


create or replace function
  public.get_pool_round_ranking_summary(
    target_pool_id uuid,
    target_round integer,
    ranking_limit integer default 100
  )
returns table (
  user_id uuid,
  user_name text,
  ranking_position bigint,
  points bigint,
  exact_scores bigint,
  correct_results bigint,
  wrong_predictions bigint,
  total_participants bigint,
  is_current_user boolean,
  is_top_entry boolean
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
      and target_round >= 1
      and exists (
        select 1
        from public.pool_members
          as requester_membership
        where
          requester_membership.pool_id =
            selected_pool.id
          and requester_membership.user_id =
            auth.uid()
      )
  ),

  members as (
    select
      membership.user_id,

      coalesce(
        '@' ||
          nullif(
            btrim(profile.username),
            ''
          ),
        '@u_' ||
          left(
            replace(
              membership.user_id::text,
              '-',
              ''
            ),
            22
          )
      ) as user_name

    from authorized_pool

    join public.pool_members
      as membership
      on membership.pool_id =
        authorized_pool.id

    join public.profiles
      as profile
      on profile.id =
        membership.user_id
  ),

  evaluated_predictions as (
    select
      prediction.user_id,

      case
        when
          pool_match.status in (
            'LIVE',
            'HALFTIME',
            'FINISHED'
          )
          and
          pool_match.official_home_score
            is not null
          and
          pool_match.official_away_score
            is not null
          and
          prediction.home_score =
            pool_match.official_home_score
          and
          prediction.away_score =
            pool_match.official_away_score
        then 'EXACT'

        when
          pool_match.status in (
            'LIVE',
            'HALFTIME',
            'FINISHED'
          )
          and
          pool_match.official_home_score
            is not null
          and
          pool_match.official_away_score
            is not null
          and
          sign(
            prediction.home_score -
            prediction.away_score
          ) =
          sign(
            pool_match.official_home_score -
            pool_match.official_away_score
          )
        then 'RESULT'

        when
          pool_match.status in (
            'LIVE',
            'HALFTIME',
            'FINISHED'
          )
          and
          pool_match.official_home_score
            is not null
          and
          pool_match.official_away_score
            is not null
        then 'WRONG'

        else null
      end as prediction_category

    from authorized_pool

    join public.predictions
      as prediction
      on prediction.pool_id =
        authorized_pool.id

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
      and match.round =
        target_round
  ),

  scores as (
    select
      member.user_id,
      member.user_name,

      coalesce(
        sum(
          case
            when
              evaluated.prediction_category =
                'EXACT'
            then 5

            when
              evaluated.prediction_category =
                'RESULT'
            then 3

            else 0
          end
        ),
        0
      )::bigint as total_points,

      count(*) filter (
        where
          evaluated.prediction_category =
            'EXACT'
      )::bigint
        as total_exact_scores,

      count(*) filter (
        where
          evaluated.prediction_category =
            'RESULT'
      )::bigint
        as total_correct_results,

      count(*) filter (
        where
          evaluated.prediction_category =
            'WRONG'
      )::bigint
        as total_wrong_predictions

    from members as member

    left join evaluated_predictions
      as evaluated
      on evaluated.user_id =
        member.user_id

    group by
      member.user_id,
      member.user_name
  ),

  ranked as (
    select
      score.*,

      dense_rank() over (
        order by
          score.total_points desc,
          score.total_exact_scores desc,
          score.total_correct_results desc
      ) as ranking_position,

      row_number() over (
        order by
          score.total_points desc,
          score.total_exact_scores desc,
          score.total_correct_results desc,
          score.user_name,
          score.user_id
      ) as ranking_row,

      count(*) over ()
        as participant_count

    from scores as score
  )

  select
    ranked.user_id,
    ranked.user_name,
    ranked.ranking_position,
    ranked.total_points
      as points,
    ranked.total_exact_scores
      as exact_scores,
    ranked.total_correct_results
      as correct_results,
    ranked.total_wrong_predictions
      as wrong_predictions,
    ranked.participant_count
      as total_participants,
    ranked.user_id =
      auth.uid()
      as is_current_user,
    ranked.ranking_row <=
      greatest(
        coalesce(
          ranking_limit,
          100
        ),
        1
      )
      as is_top_entry

  from ranked

  where
    ranked.ranking_row <=
      greatest(
        coalesce(
          ranking_limit,
          100
        ),
        1
      )
    or ranked.user_id =
      auth.uid()

  order by
    ranked.ranking_position,
    ranked.user_name;
$function$;

revoke all
on function
  public.get_pool_round_ranking_summary(
    uuid,
    integer,
    integer
  )
from public;

grant execute
on function
  public.get_pool_round_ranking_summary(
    uuid,
    integer,
    integer
  )
to authenticated;


create or replace function
  public.get_pool_round_live_prediction_deltas(
    target_pool_id uuid,
    target_round integer
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
    from public.pools
      as selected_pool
    where
      selected_pool.id =
        target_pool_id
      and target_round >= 1
      and exists (
        select 1
        from public.pool_members
          as requester_membership
        where
          requester_membership.pool_id =
            selected_pool.id
          and requester_membership.user_id =
            auth.uid()
      )
  ),

  live_predictions as (
    select
      prediction.user_id,

      case
        when
          pool_match.official_home_score
            is null
          or
          pool_match.official_away_score
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

    from authorized_pool

    join public.predictions
      as prediction
      on prediction.pool_id =
        authorized_pool.id

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
      and match.round =
        target_round

    where
      pool_match.status in (
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
          when
            live.evaluation =
              'EXACT'
          then 5

          when
            live.evaluation =
              'RESULT'
          then 3

          else 0
        end
      ),
      0
    )::bigint as live_points,

    count(*) filter (
      where
        live.evaluation =
          'EXACT'
    )::bigint
      as live_exact_scores,

    count(*) filter (
      where
        live.evaluation =
          'RESULT'
    )::bigint
      as live_correct_results,

    count(*) filter (
      where
        live.evaluation =
          'WRONG'
    )::bigint
      as live_wrong_predictions

  from live_predictions
    as live

  group by
    live.user_id;
$function$;

revoke all
on function
  public.get_pool_round_live_prediction_deltas(
    uuid,
    integer
  )
from public;

grant execute
on function
  public.get_pool_round_live_prediction_deltas(
    uuid,
    integer
  )
to authenticated;