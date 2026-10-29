-- Isolated live phone sessions for enabled establishment trials.
create table public.jury_school_trial_sessions (
 session_id uuid primary key references public.test_culinaire_sessions(session_id),
 school text not null references public.jury_school_trials(school),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index jury_school_trial_sessions_school_idx on public.jury_school_trial_sessions(school);
alter table public.jury_school_trial_sessions enable row level security;
revoke all on public.jury_school_trial_sessions from public,anon,authenticated;
grant select on public.jury_school_trial_sessions to authenticated;
create policy school_trial_phone_read on public.jury_school_trial_sessions for select to authenticated
using ((select (auth.jwt()->>'is_anonymous')::boolean) is false and exists(
 select 1 from public.jury_school_trials s where s.school=jury_school_trial_sessions.school and s.enabled
));

-- Privileged creation is atomic: authorize the school, reject unrelated existing
-- sessions, create using the established jury security routine, and link it.
create function jury_private.school_trial_create_phone_session(
 p_school text,p_session_id uuid,p_admin_config jsonb,p_public_config jsonb,p_admin_code text,p_tester_codes jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.jury_school_trials; existing_school text; result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null and u.is_anonymous is false) then
  raise exception 'verified_establishment_account_required';
 end if;
 select * into s from public.jury_school_trials where school=p_school and enabled;
 if not found or not jury_private.school_trial_access(s.email,s.enabled) then raise exception 'establishment_access_denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_session_id::text,455));
 select school into existing_school from public.jury_school_trial_sessions where session_id=p_session_id;
 if exists(select 1 from public.test_culinaire_sessions where session_id=p_session_id)
    and existing_school is distinct from p_school then raise exception 'unrelated_jury_session'; end if;
 -- This marker is set by the server, never used as an authorization claim.
 result:=public.test_culinaire_create_secure_session(p_session_id,
  p_admin_config||jsonb_build_object('_schoolTrialV455',p_school),p_public_config,p_admin_code,p_tester_codes);
 insert into public.jury_school_trial_sessions(session_id,school,created_by)
 values(p_session_id,p_school,auth.uid()) on conflict(session_id) do nothing;
 -- Existing general administrators retain their authorized overview of trials.
 insert into public.test_culinaire_memberships(session_id,user_id,role,tester_no)
 select p_session_id,m.user_id,'admin',null from public.test_culinaire_memberships m
 where m.role='admin' and m.session_id='675ee51b-915e-416a-ac45-349d6a69f524'::uuid
 and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null and u.is_anonymous is false)
 on conflict(session_id,user_id) do update set role='admin',tester_no=null;
 return result;
end $$;
revoke all on function jury_private.school_trial_create_phone_session(text,uuid,jsonb,jsonb,text,jsonb) from public,anon;
grant execute on function jury_private.school_trial_create_phone_session(text,uuid,jsonb,jsonb,text,jsonb) to authenticated;
create function public.school_trial_create_secure_session(
 p_school text,p_session_id uuid,p_admin_config jsonb,p_public_config jsonb,p_admin_code text,p_tester_codes jsonb
) returns jsonb language sql security invoker set search_path='' as $$
 select jury_private.school_trial_create_phone_session(p_school,p_session_id,p_admin_config,p_public_config,p_admin_code,p_tester_codes)
$$;
revoke all on function public.school_trial_create_secure_session(text,uuid,jsonb,jsonb,text,jsonb) from public,anon;
grant execute on function public.school_trial_create_secure_session(text,uuid,jsonb,jsonb,text,jsonb) to authenticated;
notify pgrst,'reload schema';
