create schema if not exists jury_private;
revoke all on schema jury_private from public,anon;
grant usage on schema jury_private to authenticated;
create or replace function jury_private.school_trial_access(target_email text, target_enabled boolean)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
 select 1 from auth.users u where u.id=(select auth.uid())
 and u.email_confirmed_at is not null and u.is_anonymous is not true
 and (
 exists(select 1 from public.test_culinaire_memberships m where m.user_id=u.id and m.session_id='675ee51b-915e-416a-ac45-349d6a69f524'::uuid and m.role='admin')
 or (target_enabled and lower(u.email)=target_email)
 ));
$$;
revoke all on function jury_private.school_trial_access(text,boolean) from public,anon;
grant execute on function jury_private.school_trial_access(text,boolean) to authenticated;
create table public.jury_school_trials (
 school text primary key check(school ~ '^S([1-9]|1[0-2])$'),
 label text not null,
 email text not null unique check(email=lower(email)),
 enabled boolean not null default false,
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=10000000),
 revision bigint not null default 0 check(revision>=0),
 updated_at timestamptz not null default now()
);
alter table public.jury_school_trials enable row level security;
revoke all on public.jury_school_trials from public,anon,authenticated;
grant select on public.jury_school_trials to authenticated;
grant update(payload,revision,updated_at) on public.jury_school_trials to authenticated;
create policy school_trial_select on public.jury_school_trials for select to authenticated
 using(jury_private.school_trial_access(email,enabled));
create policy school_trial_update on public.jury_school_trials for update to authenticated
 using(jury_private.school_trial_access(email,enabled))
 with check(jury_private.school_trial_access(email,enabled));
insert into public.jury_school_trials(school,label,email,enabled)
 select 'S'||n,'Établissement test '||n,'jury-test'||n||'@mailo.com',n<=2 from generate_series(1,12) n;
notify pgrst,'reload schema';
alter policy school_trial_select on public.jury_school_trials using (((select auth.jwt()->>'is_anonymous')::boolean is false) and jury_private.school_trial_access(email,enabled)); alter policy school_trial_update on public.jury_school_trials using (((select auth.jwt()->>'is_anonymous')::boolean is false) and jury_private.school_trial_access(email,enabled)) with check (((select auth.jwt()->>'is_anonymous')::boolean is false) and jury_private.school_trial_access(email,enabled));