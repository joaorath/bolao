begin;

-- Perfis antigos ainda não possuíam username.
-- Criamos um identificador privado, único e editável.
update public.profiles
set
  username =
    'u_' ||
    left(
      replace(id::text, '-', ''),
      22
    ),
  updated_at = now()
where
  username is null
  or btrim(username) = '';

create or replace function public.get_pool_ranking(
  target_pool_id uuid
)
returns table (
  user_id           uuid,
  user_name         text,
  "position"        bigint,
  points            bigint,
  exact_scores      bigint,
  correct_results   bigint,
  wrong_predictions bigint
)
language sql
stable
security definer
set search_path to ''
as $function$
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
        '@' || nullif(
          btrim(profiles.username),
          ''
        ),
        '@u_' ||
          left(
            replace(
              members.user_id::text,
              '-',
              ''
            ),
            22
          )
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
      profiles.username
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

commit;