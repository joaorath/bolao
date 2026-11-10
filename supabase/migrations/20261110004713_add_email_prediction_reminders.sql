/*
 * Ativa lembretes de palpites por e-mail
 * para contas atuais e futuras.
 *
 * O usuário poderá desativar a preferência
 * posteriormente na página de perfil.
 */

alter table public.profiles
  add column if not exists
    email_prediction_reminders_enabled boolean;

alter table public.profiles
  alter column
    email_prediction_reminders_enabled
  set default true;

update public.profiles
set
  email_prediction_reminders_enabled = true
where
  email_prediction_reminders_enabled is null;

alter table public.profiles
  alter column
    email_prediction_reminders_enabled
  set not null;

comment on column
  public.profiles.email_prediction_reminders_enabled
is
  'Indica se o usuário deseja receber por e-mail lembretes de partidas ainda sem palpite.';