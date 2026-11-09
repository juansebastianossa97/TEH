begin;
-- All test accounts and publications are rolled back; no emails or real users.
do $$
declare admin uuid:=gen_random_uuid(); editor uuid:=gen_random_uuid(); other uuid:=gen_random_uuid(); visitor uuid:=gen_random_uuid(); unconfirmed uuid:=gen_random_uuid(); r jsonb; r2 jsonb; ex uuid; doc jsonb; blocked boolean; n integer;
begin
 insert into auth.users(id,aud,role,email,email_confirmed_at,raw_user_meta_data) values
 (admin,'authenticated','authenticated','atlas-admin-test@example.invalid',now(),'{}'),
 (editor,'authenticated','authenticated','atlas-editor-test@example.invalid',now(),'{}'),
 (other,'authenticated','authenticated','atlas-other-test@example.invalid',now(),'{}'),
 (visitor,'authenticated','authenticated','atlas-visitor-test@example.invalid',now(),'{"role":"admin"}'),
 (unconfirmed,'authenticated','authenticated','atlas-unconfirmed@example.invalid',null,'{}');
 insert into public.atlas_profiles(id,display_name,role) values(admin,'Test admin','admin'),(editor,'Test author','visitor'),(other,'Other author','visitor');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',visitor,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 r:=public.atlas_command('session');assert r->>'role'='visitor','User metadata must not grant admin';
 blocked:=false;begin update public.atlas_profiles set role='admin' where id=visitor;exception when insufficient_privilege then blocked:=true;end;assert blocked,'Direct role escalation';
 r:=public.atlas_command('create');assert r->>'state'='draft','Verified account cannot create own draft';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',editor,'role','authenticated')::text,true);
 blocked:=false;begin insert into storage.objects(bucket_id,name) values('atlas-media',other::text||'/'||repeat('a',64)||'/full');exception when insufficient_privilege then blocked:=true;end;assert blocked,'Editor uploaded under another owner';
 insert into storage.objects(bucket_id,name) values('atlas-media',editor::text||'/'||repeat('a',64)||'/full'),('atlas-media',editor::text||'/'||repeat('a',64)||'/thumb');
 perform public.atlas_command('register_media',jsonb_build_object('id',repeat('a',64),'name','test.webp','mime','image/webp','width',100,'height',100,'kind','photo'));
 update storage.objects set metadata='{}' where bucket_id='atlas-media' and name=editor::text||'/'||repeat('a',64)||'/full';get diagnostics n=row_count;assert n=0,'Image can be overwritten';
 blocked:=false;begin delete from storage.objects where bucket_id='atlas-media' and name=editor::text||'/'||repeat('a',64)||'/full';get diagnostics n=row_count;blocked:=n=0;exception when insufficient_privilege then blocked:=true;end;assert blocked,'Image can be deleted';
 r:=public.atlas_command('create');ex:=(r->>'exhibition_id')::uuid;
 doc:='{"schemaVersion":1,"title":"PRUEBA TEMPORAL","location":{"lat":4.8147,"lon":-75.6954,"label":"Pereira","provider":"manual"},"blocks":[{"id":"heading","type":"heading","layout":"reading","title":"PRUEBA NO PUBLICAR","level":2}]}';
 doc:=jsonb_set(doc,'{blocks}',(doc->'blocks')||jsonb_build_array(jsonb_build_object('id','photo','type','plates','title','','layout','three-columns','items',jsonb_build_array(jsonb_build_object('assetId',repeat('a',64),'alt','Prueba')))));
 r:=public.atlas_command('save',jsonb_build_object('id',r->>'id','expected_version',1,'document',doc,'author','Test','description','Test','categories',jsonb_build_array('Ensayo')));
 blocked:=false;begin perform public.atlas_command('save',jsonb_build_object('id',r->>'id','expected_version',1,'document',doc));exception when serialization_failure then blocked:=true;end;assert blocked,'Lost-update protection missing';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',other,'role','authenticated')::text,true);
 select count(*) into n from public.atlas_revisions where id=(r->>'id')::uuid;assert n=0,'Other editor read private draft';
 blocked:=false;begin perform public.atlas_command('save',jsonb_build_object('id',r->>'id','expected_version',2,'document',doc));exception when insufficient_privilege then blocked:=true;end;assert blocked,'Other editor changed draft';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',editor,'role','authenticated')::text,true);
 blocked:=false;begin update public.atlas_revisions set state='approved' where id=(r->>'id')::uuid;exception when insufficient_privilege then blocked:=true;end;assert blocked,'Direct publication';
 r:=public.atlas_command('submit',jsonb_build_object('id',r->>'id','expected_version',r->'lock_version','note','Propuesta temporal para prueba'));
 blocked:=false;begin perform public.atlas_command('save',jsonb_build_object('id',r->>'id','expected_version',r->'lock_version','document',doc));exception when serialization_failure then blocked:=true;end;assert blocked,'Submitted version was editable';
 blocked:=false;begin perform public.atlas_command('review',jsonb_build_object('id',r->>'id','decision','approved'));exception when insufficient_privilege then blocked:=true;end;assert blocked,'Editor approved own proposal';
 perform set_config('role','anon',true);perform set_config('request.jwt.claims','{}',true);
 select count(*) into n from public.atlas_publications where exhibition_id=ex;assert n=0,'Draft visible publicly';
 select count(*) into n from storage.objects where bucket_id='atlas-media' and name=editor::text||'/'||repeat('a',64)||'/full';assert n=0,'Draft image leaked';
 blocked:=false;begin perform public.atlas_command('session');exception when insufficient_privilege then blocked:=true;end;assert blocked,'Anon mutation allowed';
 perform set_config('role','authenticated',true);perform set_config('request.jwt.claims',jsonb_build_object('sub',admin,'role','authenticated')::text,true);
 perform public.atlas_command('review',jsonb_build_object('id',r->>'id','decision','approved'));
 perform set_config('role','anon',true);perform set_config('request.jwt.claims','{}',true);
 select count(*) into n from public.atlas_publications where exhibition_id=ex;assert n=1,'Approved version not public';
 select count(*) into n from storage.objects where bucket_id='atlas-media' and name=editor::text||'/'||repeat('a',64)||'/full';assert n=1,'Published image unavailable';
 perform set_config('role','authenticated',true);perform set_config('request.jwt.claims',jsonb_build_object('sub',editor,'role','authenticated')::text,true);
 r2:=public.atlas_command('fork',jsonb_build_object('id',r->>'id'));
 doc:=jsonb_set(doc,'{title}','"PRUEBA MODIFICADA"');r2:=public.atlas_command('save',jsonb_build_object('id',r2->>'id','expected_version',1,'document',doc,'author','Test'));
 assert (select document->>'title'='PRUEBA TEMPORAL' from public.atlas_publications where exhibition_id=ex),'Draft overwrote live version';
 r2:=public.atlas_command('propose',jsonb_build_object('id',r2->>'id','expected_version',r2->'lock_version','document',doc,'author','Test','note','Segunda propuesta temporal'));
 assert r2->>'state'='submitted','Proposal not submitted';
 assert (select document->>'title'='PRUEBA TEMPORAL' from public.atlas_publications where exhibition_id=ex),'Submitted changes leaked';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin,'role','authenticated')::text,true);
 perform public.atlas_command('review',jsonb_build_object('id',r2->>'id','decision','changes_requested','note','Corregir texto'));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',editor,'role','authenticated')::text,true);
 r2:=public.atlas_command('fork',jsonb_build_object('id',r2->>'id','kind','withdraw'));
 r2:=public.atlas_command('submit',jsonb_build_object('id',r2->>'id','expected_version',r2->'lock_version','note','Retirada temporal de prueba'));
 assert (select count(*)=1 from public.atlas_publications where exhibition_id=ex),'Withdrawal happened before approval';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin,'role','authenticated')::text,true);
 perform public.atlas_command('review',jsonb_build_object('id',r2->>'id','decision','approved'));
 assert (select count(*)=0 from public.atlas_publications where exhibition_id=ex),'Approved withdrawal failed';
 perform public.atlas_command('set_permission',jsonb_build_object('id',editor,'role','editor','disabled',true));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',editor,'role','authenticated')::text,true);
 blocked:=false;begin perform public.atlas_command('create');exception when insufficient_privilege then blocked:=true;end;assert blocked,'Suspended user can create';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',unconfirmed,'role','authenticated')::text,true);
 blocked:=false;begin perform public.atlas_command('session');exception when insufficient_privilege then blocked:=true;end;assert blocked,'Unconfirmed user allowed';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',other,'role','authenticated')::text,true);
 select count(*) into n from public.atlas_exhibitions where owner_id=other;
 blocked:=false;begin perform public.atlas_command('propose',jsonb_build_object('document',jsonb_set(doc-'location','{blocks}',jsonb_build_array(doc->'blocks'->0)),'author','Test','note','Prueba de atomicidad'));exception when raise_exception then blocked:=true;end;assert blocked,'Incomplete proposal accepted';
 assert (select count(*)=n from public.atlas_exhibitions where owner_id=other),'Failed proposal created extra draft';
 doc:=jsonb_set(doc,'{blocks}',jsonb_build_array(doc->'blocks'->0));
 r:=public.atlas_command('propose',jsonb_build_object('document',doc,'author','Test','note','Nueva prueba completa'));
 assert r->>'state'='submitted' and (r->>'owner_id')::uuid=other,'Single-step submission failed';
 perform set_config('role','none',true);
end $$;
select 'PASS: registered authors, atomic proposals, ownership, stale writes, immutable review, publication, corrections, withdrawal, suspension, email confirmation, private media, immutable images' as result;
rollback;
