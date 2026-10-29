begin;
update public.jury_school_trials set email=case school when 'S1' then 'trial-one@example.invalid' when 'S2' then 'trial-two@example.invalid' else 'trial-three@example.invalid' end where school in ('S1','S2','S3');
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('00000000-0000-0000-0000-00000000b101','trial-one@example.invalid',now(),false),
 ('00000000-0000-0000-0000-00000000b102','trial-two@example.invalid',now(),false),
 ('00000000-0000-0000-0000-00000000b103','trial-three@example.invalid',now(),false),
 ('00000000-0000-0000-0000-00000000b104',null,null,true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b101","is_anonymous":false}',true);
select public.school_trial_create_secure_session('S1','00000000-0000-0000-0000-00000000c101',
 jsonb_build_object('lotName','Fictitious phone test','products','[]'::jsonb,'security',jsonb_build_object('adminTokenHash',encode(extensions.digest('admin:school-one-admin','sha256'),'hex'))),
 '{}'::jsonb,'school-one-admin','{"1":"tester-one-secret"}'::jsonb);
do $$ begin
 if (select count(*) from public.jury_school_trial_sessions)!=1 then raise exception 'school one session missing';end if;
 begin
  perform public.school_trial_create_secure_session('S2','00000000-0000-0000-0000-00000000c199','{}','{}','x','{}');
  raise exception 'cross-school create allowed';
 exception when raise_exception then if sqlerrm!='establishment_access_denied' then raise;end if;end;
 begin
  perform public.school_trial_create_secure_session('S1','675ee51b-915e-416a-ac45-349d6a69f524','{}','{}','x','{}');
  raise exception 'root session changed';
 exception when raise_exception then if sqlerrm!='unrelated_jury_session' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b102","is_anonymous":false}',true);
do $$ begin
 if exists(select 1 from public.test_culinaire_sessions where session_id='00000000-0000-0000-0000-00000000c101') then raise exception 'S2 read S1';end if;
 if exists(select 1 from public.jury_school_trial_sessions) then raise exception 'S2 mapping leaked';end if;
end $$;
select public.school_trial_create_secure_session('S2','00000000-0000-0000-0000-00000000c102',
 jsonb_build_object('lotName','Other fictitious phone test','security',jsonb_build_object('adminTokenHash',encode(extensions.digest('admin:school-two-admin','sha256'),'hex'))),
 '{}'::jsonb,'school-two-admin','{"1":"tester-two-secret"}'::jsonb);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b103","is_anonymous":false}',true);
do $$ begin
 begin
  perform public.school_trial_create_secure_session('S3','00000000-0000-0000-0000-00000000c103','{}','{}','x','{}');
  raise exception 'disabled school created session';
 exception when raise_exception then if sqlerrm!='establishment_access_denied' then raise;end if;end;
end $$;
-- A QR code grants only its one tester identity. No teacher login is required.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b104","is_anonymous":true}',true);
select * from public.test_culinaire_join_session('00000000-0000-0000-0000-00000000c101','tester-one-secret',1);
insert into public.test_culinaire_reponses(session_id,tester_no,product_id,sample_id,choices,remarks)
 values('00000000-0000-0000-0000-00000000c101',1,'p1','sample1','[3,3,3,3,3]','["Test fictif"]');
do $$ begin
 if exists(select 1 from public.test_culinaire_sessions) then raise exception 'tester read private jury';end if;
 begin
  perform public.school_trial_create_secure_session('S1','00000000-0000-0000-0000-00000000c103','{}','{}','x','{}');
  raise exception 'tester created teacher session';
 exception when raise_exception then if sqlerrm!='verified_establishment_account_required' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b101","is_anonymous":false}',true);
do $$ begin
 if (select count(*) from public.test_culinaire_reponses where session_id='00000000-0000-0000-0000-00000000c101')!=1 then raise exception 'teacher cannot retrieve tester response';end if;
 if exists(select 1 from public.test_culinaire_sessions where session_id='00000000-0000-0000-0000-00000000c102') then raise exception 'teacher read other school';end if;
end $$;
-- Both existing general accounts can follow these two sessions.
select set_config('request.jwt.claims','{"sub":"1ea24b40-a93d-418d-a363-4d55d1bd8feb","is_anonymous":false}',true);
do $$ begin
 if (select count(*) from public.test_culinaire_sessions where session_id in ('00000000-0000-0000-0000-00000000c101','00000000-0000-0000-0000-00000000c102'))!=2 then raise exception 'general account lacks access';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"226b153f-e766-4840-8ae4-de3eb313466d","is_anonymous":false}',true);
do $$ begin
 if (select count(*) from public.test_culinaire_sessions where session_id in ('00000000-0000-0000-0000-00000000c101','00000000-0000-0000-0000-00000000c102'))!=2 then raise exception 'second general account lacks access';end if;
end $$;
rollback;
