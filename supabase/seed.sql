begin;

insert into public.pools (
  id,
  owner_id,
  name,
  description,
  competition,
  visibility,
  invite_code,
  is_global
)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  null,
  'Ranking Geral',
  'Ranking oficial com todos os participantes cadastrados.',
  'Campeonato Paraense',
  'PUBLIC',
  'GERAL2026',
  true
)
on conflict (id)
do update set
  owner_id = null,
  name = excluded.name,
  description = excluded.description,
  competition = excluded.competition,
  visibility = excluded.visibility,
  invite_code = excluded.invite_code,
  is_global = true,
  updated_at = now();

commit;