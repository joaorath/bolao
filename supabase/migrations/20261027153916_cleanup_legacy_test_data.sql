begin;

do $$
begin
  if not exists (
    select 1
    from public.pools
    where id =
      '00000000-0000-4000-8000-000000000001'
      and is_global = true
  ) then
    raise exception
      'O Ranking Geral não foi encontrado. Limpeza cancelada.';
  end if;

  if not exists (
    select 1
    from public.pools
    where id =
      '4675f738-6adc-45e9-b939-e98a1f729d3f'
      and name =
        'Homologação Série B'
  ) then
    raise exception
      'O bolão de Homologação não foi encontrado. Limpeza cancelada.';
  end if;

  if (
    select count(*)
    from auth.users
    where id in (
      '3ff164b9-862f-40ca-bd49-b6df46bdc498',
      '279e7018-f184-4fd9-94fb-346ebfcf85d9',
      '1b368ff8-2aca-416c-af7e-365ddc70679e',
      '05ee8ee9-76f4-4137-b9f6-5f3a4a2c9b79',
      'ec2191b0-9483-4bf1-a883-e0e1c1fe0dc5',
      '7b344959-5ec2-4545-b87e-03d016c10ca6',
      'd12c7fa7-2395-47db-b51c-2497f28d0c7c'
    )
  ) <> 7 then
    raise exception
      'Nem todos os usuários que devem ser preservados foram encontrados. Limpeza cancelada.';
  end if;
end;
$$;

/*
 * As operações abaixo disparam os mesmos
 * gatilhos de auditoria utilizados pela aplicação.
 *
 * A migration assume temporariamente a identidade
 * do administrador preservado para que auth.uid()
 * e auth.role() funcionem durante a limpeza.
 */
select set_config(
  'request.jwt.claim.sub',
  '3ff164b9-862f-40ca-bd49-b6df46bdc498',
  true
);

select set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '3ff164b9-862f-40ca-bd49-b6df46bdc498',
    'role',
    'authenticated'
  )::text,
  true
);

/*
 * Permite exclusivamente a limpeza histórica.
 * O gatilho é reativado logo após este DELETE.
 */
alter table public.predictions
  disable trigger protect_locked_predictions;

delete from public.predictions
where
  match_id in (
    'remo-paysandu-rodada-4',
    'tuna-castanhal-rodada-4',
    'aguia-bragantino-rodada-4',
    'cameta-sao-francisco-rodada-4'
  )
  or pool_id in (
    '4346263c-71a0-499c-8fa2-42417f1e1a12',
    'c860950b-e951-42f6-b90a-0821a199c811',
    'bbcc3a9e-bf6f-4e1c-873f-2b2e12778f4b',
    'a13815b7-7b10-4af4-a52c-5bf2b9a1b03a',
    'ba110dea-ef3a-48dd-801d-04022096770f',
    'a1dc22b2-a5d6-4420-b4a7-6d9797304178',
    '38b1a4ab-a537-4dd8-b140-e532ba340ccf',
    'cf2475c0-1a37-428d-b6d2-1311ef270dd1'
  )
  or user_id in (
    'd3da892c-0b80-4ae9-9ab7-4cce5ee26c31',
    'd69fed5a-d8b2-44ad-82b4-c2df061a6c90',
    '3a21854d-8d9b-4868-9ad8-a035101fd1ec',
    '7e66ffd8-c437-40bd-9852-a56ee0fdb7fa',
    '33588397-b2a7-40be-ba33-9982c72adee8',
    'ed05a685-3a5f-4782-800a-aff81535a75f',
    '87872990-cea3-4cc6-a87f-9768da769b64',
    '18ccacb5-5959-4315-9d4a-fd27f4532410',
    '7fb63367-9b5d-42cd-adbd-2b56ddc03641',
    'd015ba18-b6b9-42dd-8f1e-877314c539df',
    '4b9e938e-76b6-4824-ad4f-896405ebe114',
    '51883109-2e33-409e-8aae-1d1df8de3817',
    'b7e65859-6af9-4dd3-8c98-b0c7d70e9766',
    'a4dcd7e0-dff7-472f-b844-1ac72d833c38'
  );

alter table public.predictions
  enable trigger protect_locked_predictions;

delete from public.pool_matches
where
  match_id in (
    'remo-paysandu-rodada-4',
    'tuna-castanhal-rodada-4',
    'aguia-bragantino-rodada-4',
    'cameta-sao-francisco-rodada-4'
  )
  or pool_id in (
    '4346263c-71a0-499c-8fa2-42417f1e1a12',
    'c860950b-e951-42f6-b90a-0821a199c811',
    'bbcc3a9e-bf6f-4e1c-873f-2b2e12778f4b',
    'a13815b7-7b10-4af4-a52c-5bf2b9a1b03a',
    'ba110dea-ef3a-48dd-801d-04022096770f',
    'a1dc22b2-a5d6-4420-b4a7-6d9797304178',
    '38b1a4ab-a537-4dd8-b140-e532ba340ccf',
    'cf2475c0-1a37-428d-b6d2-1311ef270dd1'
  );

delete from public.pool_members
where
  pool_id in (
    '4346263c-71a0-499c-8fa2-42417f1e1a12',
    'c860950b-e951-42f6-b90a-0821a199c811',
    'bbcc3a9e-bf6f-4e1c-873f-2b2e12778f4b',
    'a13815b7-7b10-4af4-a52c-5bf2b9a1b03a',
    'ba110dea-ef3a-48dd-801d-04022096770f',
    'a1dc22b2-a5d6-4420-b4a7-6d9797304178',
    '38b1a4ab-a537-4dd8-b140-e532ba340ccf',
    'cf2475c0-1a37-428d-b6d2-1311ef270dd1'
  )
  or user_id in (
    'd3da892c-0b80-4ae9-9ab7-4cce5ee26c31',
    'd69fed5a-d8b2-44ad-82b4-c2df061a6c90',
    '3a21854d-8d9b-4868-9ad8-a035101fd1ec',
    '7e66ffd8-c437-40bd-9852-a56ee0fdb7fa',
    '33588397-b2a7-40be-ba33-9982c72adee8',
    'ed05a685-3a5f-4782-800a-aff81535a75f',
    '87872990-cea3-4cc6-a87f-9768da769b64',
    '18ccacb5-5959-4315-9d4a-fd27f4532410',
    '7fb63367-9b5d-42cd-adbd-2b56ddc03641',
    'd015ba18-b6b9-42dd-8f1e-877314c539df',
    '4b9e938e-76b6-4824-ad4f-896405ebe114',
    '51883109-2e33-409e-8aae-1d1df8de3817',
    'b7e65859-6af9-4dd3-8c98-b0c7d70e9766',
    'a4dcd7e0-dff7-472f-b844-1ac72d833c38'
  );

delete from public.pools
where id in (
  '4346263c-71a0-499c-8fa2-42417f1e1a12',
  'c860950b-e951-42f6-b90a-0821a199c811',
  'bbcc3a9e-bf6f-4e1c-873f-2b2e12778f4b',
  'a13815b7-7b10-4af4-a52c-5bf2b9a1b03a',
  'ba110dea-ef3a-48dd-801d-04022096770f',
  'a1dc22b2-a5d6-4420-b4a7-6d9797304178',
  '38b1a4ab-a537-4dd8-b140-e532ba340ccf',
  'cf2475c0-1a37-428d-b6d2-1311ef270dd1'
);

delete from public.matches
where id in (
  'remo-paysandu-rodada-4',
  'tuna-castanhal-rodada-4',
  'aguia-bragantino-rodada-4',
  'cameta-sao-francisco-rodada-4'
);

delete from public.profiles
where id in (
  'd3da892c-0b80-4ae9-9ab7-4cce5ee26c31',
  'd69fed5a-d8b2-44ad-82b4-c2df061a6c90',
  '3a21854d-8d9b-4868-9ad8-a035101fd1ec',
  '7e66ffd8-c437-40bd-9852-a56ee0fdb7fa',
  '33588397-b2a7-40be-ba33-9982c72adee8',
  'ed05a685-3a5f-4782-800a-aff81535a75f',
  '87872990-cea3-4cc6-a87f-9768da769b64',
  '18ccacb5-5959-4315-9d4a-fd27f4532410',
  '7fb63367-9b5d-42cd-adbd-2b56ddc03641',
  'd015ba18-b6b9-42dd-8f1e-877314c539df',
  '4b9e938e-76b6-4824-ad4f-896405ebe114',
  '51883109-2e33-409e-8aae-1d1df8de3817',
  'b7e65859-6af9-4dd3-8c98-b0c7d70e9766',
  'a4dcd7e0-dff7-472f-b844-1ac72d833c38'
);

delete from auth.users
where id in (
  'd3da892c-0b80-4ae9-9ab7-4cce5ee26c31',
  'd69fed5a-d8b2-44ad-82b4-c2df061a6c90',
  '3a21854d-8d9b-4868-9ad8-a035101fd1ec',
  '7e66ffd8-c437-40bd-9852-a56ee0fdb7fa',
  '33588397-b2a7-40be-ba33-9982c72adee8',
  'ed05a685-3a5f-4782-800a-aff81535a75f',
  '87872990-cea3-4cc6-a87f-9768da769b64',
  '18ccacb5-5959-4315-9d4a-fd27f4532410',
  '7fb63367-9b5d-42cd-adbd-2b56ddc03641',
  'd015ba18-b6b9-42dd-8f1e-877314c539df',
  '4b9e938e-76b6-4824-ad4f-896405ebe114',
  '51883109-2e33-409e-8aae-1d1df8de3817',
  'b7e65859-6af9-4dd3-8c98-b0c7d70e9766',
  'a4dcd7e0-dff7-472f-b844-1ac72d833c38'
);

do $$
begin
  if exists (
    select 1
    from public.pools
    where id not in (
      '00000000-0000-4000-8000-000000000001',
      '4675f738-6adc-45e9-b939-e98a1f729d3f'
    )
  ) then
    raise exception
      'Ainda existem bolões inesperados após a limpeza.';
  end if;

  if exists (
    select 1
    from public.matches
    where id in (
      'remo-paysandu-rodada-4',
      'tuna-castanhal-rodada-4',
      'aguia-bragantino-rodada-4',
      'cameta-sao-francisco-rodada-4'
    )
  ) then
    raise exception
      'Ainda existem partidas manuais antigas após a limpeza.';
  end if;

  if exists (
    select 1
    from auth.users
    where id in (
      'd3da892c-0b80-4ae9-9ab7-4cce5ee26c31',
      'd69fed5a-d8b2-44ad-82b4-c2df061a6c90',
      '3a21854d-8d9b-4868-9ad8-a035101fd1ec',
      '7e66ffd8-c437-40bd-9852-a56ee0fdb7fa',
      '33588397-b2a7-40be-ba33-9982c72adee8',
      'ed05a685-3a5f-4782-800a-aff81535a75f',
      '87872990-cea3-4cc6-a87f-9768da769b64',
      '18ccacb5-5959-4315-9d4a-fd27f4532410',
      '7fb63367-9b5d-42cd-adbd-2b56ddc03641',
      'd015ba18-b6b9-42dd-8f1e-877314c539df',
      '4b9e938e-76b6-4824-ad4f-896405ebe114',
      '51883109-2e33-409e-8aae-1d1df8de3817',
      'b7e65859-6af9-4dd3-8c98-b0c7d70e9766',
      'a4dcd7e0-dff7-472f-b844-1ac72d833c38'
    )
  ) then
    raise exception
      'Ainda existem usuários de teste após a limpeza.';
  end if;
end;
$$;

commit;