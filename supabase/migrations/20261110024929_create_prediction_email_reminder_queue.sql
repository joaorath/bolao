/*
 * Registra e reserva os lembretes enviados
 * para impedir duplicidade entre execuções
 * simultâneas ou repetidas do cron.
 */

create table if not exists
  public.prediction_email_reminder_deliveries (
    id uuid primary key
      default gen_random_uuid(),

    user_id uuid not null
      references auth.users(id)
      on delete cascade,

    match_id text not null
      references public.matches(id)
      on update cascade
      on delete cascade,

    status text not null
      default 'PROCESSING',

    attempt_count integer not null
      default 1,

    claimed_at timestamp with time zone
      not null default now(),

    sent_at timestamp with time zone,

    provider_message_id text,

    last_error text,

    created_at timestamp with time zone
      not null default now(),

    updated_at timestamp with time zone
      not null default now(),

    constraint
      prediction_email_reminder_status_check
      check (
        status in (
          'PROCESSING',
          'SENT',
          'FAILED'
        )
      ),

    constraint
      prediction_email_reminder_attempt_count_check
      check (
        attempt_count >= 1
        and attempt_count <= 3
      ),

    constraint
      prediction_email_reminder_user_match_key
      unique (
        user_id,
        match_id
      )
  );

create index if not exists
  prediction_email_reminder_status_index
on public.prediction_email_reminder_deliveries (
  status,
  updated_at
);

alter table
  public.prediction_email_reminder_deliveries
enable row level security;

revoke all
on table
  public.prediction_email_reminder_deliveries
from anon, authenticated;

grant select, insert, update
on table
  public.prediction_email_reminder_deliveries
to service_role;

comment on table
  public.prediction_email_reminder_deliveries
is
  'Controle de tentativas e envios dos lembretes de palpites por e-mail.';

/*
 * Reserva os lembretes elegíveis.
 *
 * A janela de 20 a 35 minutos permite
 * pequenas variações do cron e novas
 * tentativas em caso de falha.
 */
create or replace function
  public.claim_due_prediction_email_reminders(
    claim_limit integer default 100
  )
returns table (
  delivery_id uuid,
  user_id uuid,
  recipient_email text,
  recipient_name text,
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
  with global_pool as (
    select selected_pool.id
    from public.pools
      as selected_pool
    where
      selected_pool.is_global = true
    order by
      selected_pool.created_at asc
    limit 1
  ),

  eligible_reminders as (
    select
      profile.id as user_id,
      auth_user.email::text
        as recipient_email,
      profile.full_name
        as recipient_name,
      match_record.id
        as match_id,
      match_record.competition,
      match_record.round,
      match_record.starts_at,
      match_record.home_team_name,
      match_record.away_team_name
    from global_pool
      as selected_global_pool
    join public.pool_matches
      as pool_match
      on pool_match.pool_id =
        selected_global_pool.id
    join public.matches
      as match_record
      on match_record.id =
        pool_match.match_id
    cross join public.profiles
      as profile
    join auth.users
      as auth_user
      on auth_user.id =
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
        .email_prediction_reminders_enabled
          = true
      and auth_user.email is not null
      and trim(auth_user.email) <> ''
      and auth_user.email_confirmed_at
        is not null
      and exists (
        select 1
        from public.pool_members
          as global_membership
        where
          global_membership.pool_id =
            selected_global_pool.id
          and global_membership.user_id =
            profile.id
      )
      and not exists (
        select 1
        from public.predictions
          as existing_prediction
        where
          existing_prediction.pool_id =
            selected_global_pool.id
          and existing_prediction.match_id =
            match_record.id
          and existing_prediction.user_id =
            profile.id
      )
    order by
      match_record.starts_at asc,
      profile.id asc
    limit greatest(
      1,
      least(
        coalesce(claim_limit, 100),
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
  public.claim_due_prediction_email_reminders(
    integer
  )
from public, anon, authenticated;

grant execute
on function
  public.claim_due_prediction_email_reminders(
    integer
  )
to service_role;