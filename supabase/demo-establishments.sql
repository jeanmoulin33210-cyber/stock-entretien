create table public.jury_demo_workspaces (
  school text primary key check (school in ('A','B')),
  label text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=10485760),
  revision bigint not null default 0 check (revision>=0),
  updated_at timestamptz not null default now()
);
alter table public.jury_demo_workspaces enable row level security;
revoke all on public.jury_demo_workspaces from anon,authenticated;
grant select on public.jury_demo_workspaces to authenticated;
grant update(payload,revision,updated_at) on public.jury_demo_workspaces to authenticated;
create policy demo_general_admin_select on public.jury_demo_workspaces for select to authenticated using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false
  and exists(select 1 from public.test_culinaire_memberships m where m.session_id='675ee51b-915e-416a-ac45-349d6a69f524'::uuid and m.user_id=(select auth.uid()) and m.role='admin')
);
create policy demo_general_admin_update on public.jury_demo_workspaces for update to authenticated using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false
  and exists(select 1 from public.test_culinaire_memberships m where m.session_id='675ee51b-915e-416a-ac45-349d6a69f524'::uuid and m.user_id=(select auth.uid()) and m.role='admin')
) with check (
  coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false
  and exists(select 1 from public.test_culinaire_memberships m where m.session_id='675ee51b-915e-416a-ac45-349d6a69f524'::uuid and m.user_id=(select auth.uid()) and m.role='admin')
);
insert into public.jury_demo_workspaces(school,label) values ('A','Lycée test A'),('B','Lycée test B');
comment on table public.jury_demo_workspaces is 'Isolated, fictitious establishment exercise snapshots. General administrators simulate A/B roles; these are not production establishment accounts.';
