revoke all
on table public.profiles
from authenticated;

grant select
on table public.profiles
to authenticated;

grant update (
  full_name,
  username,
  birth_date,
  favorite_team_id,
  social_following_status,
  updated_at
)
on table public.profiles
to authenticated;