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
          and (
            auth.uid() is null
            or id <> auth.uid()
          )
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