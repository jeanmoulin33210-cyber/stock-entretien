begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
('00000000-0000-0000-0000-00000000a101','jury-test1@mailo.com',now(),false),
('00000000-0000-0000-0000-00000000a102','jury-test2@mailo.com',now(),false),
('00000000-0000-0000-0000-00000000a103','jury-test3@mailo.com',now(),false),
('00000000-0000-0000-0000-00000000a104','unrelated@example.invalid',now(),false),
('00000000-0000-0000-0000-00000000a105','unconfirmed@example.invalid',null,false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a101","is_anonymous":false}',true);
do $$ declare n int; begin
if (select count(*) from public.jury_school_trials)!=1 then raise exception 'S1 isolation'; end if;
update public.jury_school_trials set revision=revision+1 where school='S2';get diagnostics n=row_count;if n!=0 then raise exception 'cross write';end if;
update public.jury_school_trials set revision=1 where school='S1' and revision=0;get diagnostics n=row_count;if n!=1 then raise exception 'own save';end if;
update public.jury_school_trials set revision=1 where school='S1' and revision=0;get diagnostics n=row_count;if n!=0 then raise exception 'CAS';end if;
begin update public.jury_school_trials set enabled=false where school='S1';raise exception 'grant escalation';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a102","is_anonymous":false}',true);
do $$ begin if (select array_agg(school) from public.jury_school_trials)!=array['S2'] then raise exception 'S2 isolation';end if;end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a103","is_anonymous":false}',true);
do $$ begin if exists(select 1 from public.jury_school_trials) then raise exception 'disabled access';end if;end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a104","is_anonymous":false,"email":"jury-test1@mailo.com"}',true);
do $$ begin if exists(select 1 from public.jury_school_trials) then raise exception 'email claim spoof';end if;end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a101","is_anonymous":true}',true);
do $$ begin if exists(select 1 from public.jury_school_trials) then raise exception 'anonymous access';end if;end $$;
select set_config('request.jwt.claims','{"sub":"1ea24b40-a93d-418d-a363-4d55d1bd8feb","is_anonymous":false}',true);
do $$ begin if (select count(*) from public.jury_school_trials)!=12 then raise exception 'general admin';end if;end $$;
select set_config('request.jwt.claims','{"sub":"226b153f-e766-4840-8ae4-de3eb313466d","is_anonymous":false}',true);
do $$ begin if (select count(*) from public.jury_school_trials)!=12 then raise exception 'second general admin';end if;end $$;
rollback;