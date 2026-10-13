create table public.teams (
  id text primary key,
  name text not null,
  abbreviation text not null,
  competition text not null,
  season integer not null,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp with time zone
    not null default now(),

  constraint teams_id_format_check
    check (
      id ~ '^[a-z0-9-]{2,50}$'
    ),

  constraint teams_name_length_check
    check (
      char_length(name) between 2 and 80
    ),

  constraint teams_abbreviation_check
    check (
      abbreviation ~ '^[A-Z0-9]{2,5}$'
    ),

  constraint teams_season_check
    check (
      season between 2020 and 2100
    )
);

alter table public.teams
  enable row level security;

revoke all
on table public.teams
from anon, authenticated;

grant select
on table public.teams
to anon, authenticated;

create policy
  "Anyone can view active teams"
on public.teams
for select
to anon, authenticated
using (active = true);

insert into public.teams (
  id,
  name,
  abbreviation,
  competition,
  season,
  display_order
)
values
  (
    'aguia-de-maraba',
    'Águia de Marabá',
    'AGU',
    'Campeonato Paraense',
    2026,
    1
  ),
  (
    'amazonia',
    'Amazônia',
    'AMZ',
    'Campeonato Paraense',
    2026,
    2
  ),
  (
    'bragantino-pa',
    'Bragantino-PA',
    'BRA',
    'Campeonato Paraense',
    2026,
    3
  ),
  (
    'cameta',
    'Cametá',
    'CAM',
    'Campeonato Paraense',
    2026,
    4
  ),
  (
    'capitao-poco',
    'Capitão Poço',
    'CPO',
    'Campeonato Paraense',
    2026,
    5
  ),
  (
    'castanhal',
    'Castanhal',
    'CAS',
    'Campeonato Paraense',
    2026,
    6
  ),
  (
    'paysandu',
    'Paysandu',
    'PSC',
    'Campeonato Paraense',
    2026,
    7
  ),
  (
    'remo',
    'Remo',
    'REM',
    'Campeonato Paraense',
    2026,
    8
  ),
  (
    'santa-rosa',
    'Santa Rosa',
    'SRO',
    'Campeonato Paraense',
    2026,
    9
  ),
  (
    'sao-francisco',
    'São Francisco',
    'SFR',
    'Campeonato Paraense',
    2026,
    10
  ),
  (
    'sao-raimundo',
    'São Raimundo',
    'SRM',
    'Campeonato Paraense',
    2026,
    11
  ),
  (
    'tuna-luso',
    'Tuna Luso',
    'TUN',
    'Campeonato Paraense',
    2026,
    12
  );

alter table public.profiles
  add column if not exists username text,
  add column if not exists birth_date date,
  add column if not exists favorite_team_id text,
  add column if not exists
    social_following_status text
    not null
    default 'NOT_ANSWERED';

alter table public.profiles
  add constraint
    profiles_username_format_check
  check (
    username is null
    or username ~ '^[a-z0-9_]{3,24}$'
  );

alter table public.profiles
  add constraint
    profiles_birth_date_check
  check (
    birth_date is null
    or (
      birth_date >= date '1900-01-01'
      and birth_date <= current_date
    )
  );

alter table public.profiles
  add constraint
    profiles_social_following_status_check
  check (
    social_following_status in (
      'BOTH',
      'INSTAGRAM',
      'YOUTUBE',
      'NONE',
      'NOT_ANSWERED'
    )
  );

alter table public.profiles
  add constraint
    profiles_favorite_team_id_fkey
  foreign key (favorite_team_id)
  references public.teams(id)
  on update cascade
  on delete set null;

create unique index
  profiles_username_lower_key
on public.profiles (
  lower(username)
)
where username is not null;

create index
  profiles_favorite_team_id_index
on public.profiles (
  favorite_team_id
);

create or replace function
  public.is_username_available(
    username_value text
  )
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    case
      when username_value is null
        then false
      when lower(trim(username_value))
        !~ '^[a-z0-9_]{3,24}$'
        then false
      else not exists (
        select 1
        from public.profiles
        where lower(username) =
          lower(trim(username_value))
      )
    end;
$function$;

revoke all
on function
  public.is_username_available(text)
from public;

grant execute
on function
  public.is_username_available(text)
to anon, authenticated, service_role;

create or replace function
  public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_username text;
  selected_birth_date date;
  selected_favorite_team_id text;
  selected_social_status text;
begin
  selected_username :=
    lower(
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'username'
        ),
        ''
      )
    );

  if selected_username is not null
     and selected_username
       !~ '^[a-z0-9_]{3,24}$'
  then
    raise exception
      'O nome de usuário é inválido.';
  end if;

  begin
    selected_birth_date :=
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'birth_date'
        ),
        ''
      )::date;
  exception
    when invalid_datetime_format
      or datetime_field_overflow
    then
      raise exception
        'A data de nascimento é inválida.';
  end;

  if selected_birth_date is not null
     and (
       selected_birth_date <
         date '1900-01-01'
       or selected_birth_date >
         current_date
     )
  then
    raise exception
      'A data de nascimento é inválida.';
  end if;

  selected_favorite_team_id :=
    nullif(
      trim(
        new.raw_user_meta_data
          ->> 'favorite_team_id'
      ),
      ''
    );

  if selected_favorite_team_id
       is not null
     and not exists (
       select 1
       from public.teams
       where id =
         selected_favorite_team_id
         and active = true
     )
  then
    raise exception
      'O time selecionado é inválido.';
  end if;

  selected_social_status :=
    upper(
      coalesce(
        nullif(
          trim(
            new.raw_user_meta_data
              ->> 'social_following_status'
          ),
          ''
        ),
        'NOT_ANSWERED'
      )
    );

  if selected_social_status not in (
    'BOTH',
    'INSTAGRAM',
    'YOUTUBE',
    'NONE',
    'NOT_ANSWERED'
  ) then
    selected_social_status :=
      'NOT_ANSWERED';
  end if;

  insert into public.profiles (
    id,
    full_name,
    username,
    birth_date,
    favorite_team_id,
    social_following_status
  )
  values (
    new.id,
    coalesce(
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),
      'Participante'
    ),
    selected_username,
    selected_birth_date,
    selected_favorite_team_id,
    selected_social_status
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
  on conflict (
    pool_id,
    user_id
  )
  do nothing;

  return new;
end;
$function$;