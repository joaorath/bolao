alter table public.profiles
  add column if not exists followed_social_networks
    text[] not null default array[]::text[],
  add column if not exists social_following_answered
    boolean not null default false;

alter table public.profiles
  drop constraint if exists
    profiles_followed_social_networks_check;

alter table public.profiles
  add constraint
    profiles_followed_social_networks_check
  check (
    followed_social_networks
      <@ array[
        'INSTAGRAM',
        'YOUTUBE',
        'TIKTOK',
        'FACEBOOK'
      ]::text[]
    and (
      social_following_answered = true
      or cardinality(
        followed_social_networks
      ) = 0
    )
  );

update public.profiles
set
  followed_social_networks =
    case social_following_status
      when 'BOTH' then
        array[
          'INSTAGRAM',
          'YOUTUBE'
        ]::text[]
      when 'INSTAGRAM' then
        array['INSTAGRAM']::text[]
      when 'YOUTUBE' then
        array['YOUTUBE']::text[]
      else
        array[]::text[]
    end,
  social_following_answered =
    social_following_status
      <> 'NOT_ANSWERED';

grant update (
  followed_social_networks,
  social_following_answered
)
on public.profiles
to authenticated;

comment on column
  public.profiles.followed_social_networks
is
  'Redes sociais do Varanda Esportes que o usuario declarou seguir.';

comment on column
  public.profiles.social_following_answered
is
  'Indica se o usuario respondeu a pergunta opcional sobre redes sociais.';

create or replace function
  public.handle_new_user_social_preferences()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_social_json jsonb;

  selected_social_networks
    text[] := array[]::text[];

  selected_answered
    boolean := false;

  selected_legacy_status
    text := 'NOT_ANSWERED';
begin
  selected_answered :=
    lower(
      coalesce(
        new.raw_user_meta_data
          ->> 'social_following_answered',
        'false'
      )
    ) = 'true';

  if jsonb_typeof(
    new.raw_user_meta_data
      -> 'followed_social_networks'
  ) = 'array'
  then
    selected_social_json :=
      new.raw_user_meta_data
        -> 'followed_social_networks';
  else
    selected_social_json :=
      '[]'::jsonb;
  end if;

  select
    coalesce(
      array_agg(
        distinct upper(
          trim(social_network_value)
        )
      ),
      array[]::text[]
    )
  into selected_social_networks
  from jsonb_array_elements_text(
    selected_social_json
  ) as social_network(
    social_network_value
  )
  where upper(
    trim(social_network_value)
  ) in (
    'INSTAGRAM',
    'YOUTUBE',
    'TIKTOK',
    'FACEBOOK'
  );

  if not selected_answered then
    selected_social_networks :=
      array[]::text[];
  end if;

  if not selected_answered then
    selected_legacy_status :=
      'NOT_ANSWERED';

  elsif
    selected_social_networks
      @> array['INSTAGRAM']::text[]
    and
    selected_social_networks
      @> array['YOUTUBE']::text[]
  then
    selected_legacy_status :=
      'BOTH';

  elsif selected_social_networks
    @> array['INSTAGRAM']::text[]
  then
    selected_legacy_status :=
      'INSTAGRAM';

  elsif selected_social_networks
    @> array['YOUTUBE']::text[]
  then
    selected_legacy_status :=
      'YOUTUBE';

  else
    selected_legacy_status :=
      'NONE';
  end if;

  update public.profiles
  set
    followed_social_networks =
      selected_social_networks,
    social_following_answered =
      selected_answered,
    social_following_status =
      selected_legacy_status,
    updated_at = now()
  where id = new.id;

  return new;
end;
$function$;

drop trigger if exists
  on_auth_user_created_social_preferences
on auth.users;

create trigger
  on_auth_user_created_social_preferences
after insert
on auth.users
for each row
execute function
  public.handle_new_user_social_preferences();

revoke all
on function
  public.handle_new_user_social_preferences()
from public;