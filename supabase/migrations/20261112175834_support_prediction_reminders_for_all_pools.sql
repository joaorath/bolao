/*
 * Permite lembretes para partidas de qualquer bolao.
 *
 * O Ranking Geral continua tendo prioridade.
 * Quando uma partida nao estiver disponivel nele,
 * um bolao privado do usuario pode gerar o lembrete.
 */

create or replace function
  public.claim_due_prediction_email_reminders_v2(
    claim_limit integer default 100
  )
returns table (
  delivery_id uuid,
  user_id uuid,
  recipient_email text,
  recipient_name text,
  pool_id uuid,
  pool_name text,
  pool_is_global boolean,
  match_id text,
  competition text,
  round integer,
  starts_at timestamp with time zone,
  home_team_name text,
  away_team_name text
)
language sql
security definer
set search_path to ''
as $function$
  with candidate_reminders as (
    select
      profile.id
        as user_id,

      auth_user.email::text
        as recipient_email,

      profile.full_name
        as recipient_name,

      pool.id
        as pool_id,

      pool.name
        as pool_name,

      pool.is_global
        as pool_is_global,

      match_record.id
        as match_id,

      match_record.competition,
      match_record.round,
      match_record.starts_at,
      match_record.home_team_name,
      match_record.away_team_name,

      prediction.user_id
        as prediction_user_id,

      row_number() over (
        partition by
          profile.id,
          match_record.id

        order by
          pool.is_global desc,

          (
            prediction.user_id
              is null
          ) desc,

          pool.created_at asc,
          pool.id asc
      ) as pool_priority

    from public.pools
      as pool

    join public.pool_matches
      as pool_match
      on pool_match.pool_id =
        pool.id

    join public.matches
      as match_record
      on match_record.id =
        pool_match.match_id

    join public.pool_members
      as membership
      on membership.pool_id =
        pool.id

    join public.profiles
      as profile
      on profile.id =
        membership.user_id

    join auth.users
      as auth_user
      on auth_user.id =
        profile.id

    left join public.predictions
      as prediction
      on prediction.pool_id =
        pool.id
      and prediction.match_id =
        match_record.id
      and prediction.user_id =
        profile.id

    where
      pool_match.status in (
        'OPEN',
        'SCHEDULED'
      )

      and match_record.starts_at >=
        now() + interval '20 minutes'

      and match_record.starts_at <=
        now() + interval '35 minutes'

      and profile
        .email_prediction_reminders_enabled =
          true

      and auth_user.email
        is not null

      and trim(
        auth_user.email
      ) <> ''

      and auth_user.email_confirmed_at
        is not null
  ),

  eligible_reminders as (
    select
      candidate.user_id,
      candidate.recipient_email,
      candidate.recipient_name,
      candidate.pool_id,
      candidate.pool_name,
      candidate.pool_is_global,
      candidate.match_id,
      candidate.competition,
      candidate.round,
      candidate.starts_at,
      candidate.home_team_name,
      candidate.away_team_name

    from candidate_reminders
      as candidate

    where
      candidate.pool_priority = 1

      and candidate.prediction_user_id
        is null

    order by
      candidate.starts_at asc,
      candidate.user_id asc

    limit greatest(
      1,
      least(
        coalesce(
          claim_limit,
          100
        ),
        500
      )
    )
  ),

  claimed_deliveries as (
    insert into
      public.prediction_email_reminder_deliveries
        as existing_delivery (
          user_id,
          match_id,
          status,
          attempt_count,
          claimed_at,
          sent_at,
          provider_message_id,
          last_error,
          updated_at
        )

    select
      eligible.user_id,
      eligible.match_id,
      'PROCESSING',
      1,
      now(),
      null,
      null,
      null,
      now()

    from eligible_reminders
      as eligible

    on conflict (
      user_id,
      match_id
    )
    do update
    set
      status = 'PROCESSING',

      attempt_count =
        existing_delivery.attempt_count + 1,

      claimed_at = now(),
      sent_at = null,
      provider_message_id = null,
      last_error = null,
      updated_at = now()

    where
      (
        existing_delivery.status =
          'FAILED'

        and existing_delivery
          .attempt_count < 3

        and existing_delivery.updated_at <=
          now() - interval '2 minutes'
      )

      or (
        existing_delivery.status =
          'PROCESSING'

        and existing_delivery
          .attempt_count < 3

        and existing_delivery.updated_at <=
          now() - interval '10 minutes'
      )

    returning
      existing_delivery.id
        as delivery_id,

      existing_delivery.user_id,
      existing_delivery.match_id
  )

  select
    claimed.delivery_id,
    eligible.user_id,
    eligible.recipient_email,
    eligible.recipient_name,
    eligible.pool_id,
    eligible.pool_name,
    eligible.pool_is_global,
    eligible.match_id,
    eligible.competition,
    eligible.round,
    eligible.starts_at,
    eligible.home_team_name,
    eligible.away_team_name

  from claimed_deliveries
    as claimed

  join eligible_reminders
    as eligible
    on eligible.user_id =
      claimed.user_id

    and eligible.match_id =
      claimed.match_id

  order by
    eligible.starts_at asc,
    eligible.user_id asc;
$function$;

revoke all
on function
  public.claim_due_prediction_email_reminders_v2(
    integer
  )
from public, anon, authenticated;

grant execute
on function
  public.claim_due_prediction_email_reminders_v2(
    integer
  )
to service_role;

comment on function
  public.claim_due_prediction_email_reminders_v2(
    integer
  )
is
  'Reserva lembretes de partidas sem palpite em qualquer bolao, priorizando o Ranking Geral.';