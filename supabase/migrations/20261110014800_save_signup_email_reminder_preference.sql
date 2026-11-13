/*
 * Copia para public.profiles a preferência
 * de lembretes enviada durante o cadastro.
 *
 * O valor padrão é true para manter os
 * lembretes ativados quando o campo não existir.
 */

create or replace function
  public.handle_new_user_email_prediction_reminders()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_reminders_enabled
    boolean := true;

  submitted_value text;
begin
  submitted_value :=
    lower(
      coalesce(
        nullif(
          trim(
            new.raw_user_meta_data
              ->> 'email_prediction_reminders_enabled'
          ),
          ''
        ),
        'true'
      )
    );

  selected_reminders_enabled :=
    case submitted_value
      when 'false' then false
      when '0' then false
      when 'off' then false
      when 'no' then false
      else true
    end;

  update public.profiles
  set
    email_prediction_reminders_enabled =
      selected_reminders_enabled,
    updated_at = now()
  where id = new.id;

  return new;
end;
$function$;

drop trigger if exists
  on_auth_user_created_email_prediction_reminders
on auth.users;

create trigger
  on_auth_user_created_email_prediction_reminders
after insert
on auth.users
for each row
execute function
  public.handle_new_user_email_prediction_reminders();

revoke all
on function
  public.handle_new_user_email_prediction_reminders()
from public;

grant execute
on function
  public.handle_new_user_email_prediction_reminders()
to postgres, service_role;