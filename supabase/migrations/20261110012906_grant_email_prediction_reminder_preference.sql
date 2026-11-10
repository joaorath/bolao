/*
 * A política RLS já limita a alteração ao
 * perfil do próprio usuário.
 *
 * Esta permissão autoriza a role authenticated
 * a atualizar especificamente a preferência
 * de lembretes.
 */

grant update (
  email_prediction_reminders_enabled
)
on table public.profiles
to authenticated;