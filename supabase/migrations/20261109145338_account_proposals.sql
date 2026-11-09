-- Previous editor approvals become ordinary verified accounts.
update public.atlas_profiles set role='visitor' where role='editor';
create or replace function atlas_private.is_editor() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.atlas_profiles p join auth.users u on u.id=p.id
 where p.id=auth.uid() and not p.disabled and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false))
$$;
create or replace function atlas_private.command(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); profile public.atlas_profiles; usr auth.users; r public.atlas_revisions; req public.atlas_edit_requests;
 target public.atlas_profiles; exhibition uuid; current_public uuid; result_id uuid; asset text; media jsonb; cats text[]; decision text; expected integer; bootstrap text;
begin
 if actor is null then raise exception 'Inicia sesión' using errcode='42501'; end if;
 select * into usr from auth.users where id=actor;
 if usr.id is null or usr.email_confirmed_at is null or coalesce(usr.is_anonymous,false) then raise exception 'Confirma tu correo para continuar' using errcode='42501'; end if;
 if octet_length(coalesce(payload,'{}')::text)>2200000 then raise exception 'Solicitud demasiado grande'; end if;
 if action='session' then
  insert into public.atlas_profiles(id,display_name) values(actor,left(coalesce(nullif(usr.raw_user_meta_data->>'display_name',''),'Usuario'),100)) on conflict(id) do nothing;
  select email into bootstrap from atlas_private.admin_bootstrap where lower(email)=lower(usr.email) and claimed_by is null for update;
  if bootstrap is not null then
   update public.atlas_profiles set role='admin',disabled=false where id=actor;
   update atlas_private.admin_bootstrap set claimed_by=actor,claimed_at=now() where email=bootstrap;
  end if;
 end if;
 select * into profile from public.atlas_profiles where id=actor for update;
 if profile.id is null or profile.disabled then raise exception 'Cuenta no habilitada' using errcode='42501'; end if;
 if action='session' then return to_jsonb(profile); end if;
 if action='set_permission' then
  if profile.role<>'admin' then raise exception 'Solo el administrador puede gestionar permisos' using errcode='42501'; end if;
  select * into target from public.atlas_profiles where id=(payload->>'id')::uuid for update;
  if target.id is null or target.role='admin' or target.id=actor then raise exception 'No se puede modificar esa cuenta desde aquí'; end if;
  update public.atlas_profiles set disabled=coalesce((payload->>'disabled')::boolean,false) where id=target.id;
  return jsonb_build_object('id',target.id);
 end if;
 if action='review' then
  if profile.role<>'admin' then raise exception 'Solo el administrador puede publicar' using errcode='42501'; end if;
  select * into r from public.atlas_revisions where id=(payload->>'id')::uuid for update;
  decision:=payload->>'decision';
  if r.id is null or r.state<>'submitted' or decision not in ('approved','changes_requested','rejected') then raise exception 'La propuesta ya se resolvió o la decisión no es válida'; end if;
  if decision<>'approved' and length(trim(coalesce(payload->>'note','')))<3 then raise exception 'Explica las correcciones o el rechazo'; end if;
  perform 1 from public.atlas_exhibitions where id=r.exhibition_id for update;
  select revision_id into current_public from public.atlas_publications where exhibition_id=r.exhibition_id;
  if decision='approved' then
   if r.base_revision_id is distinct from current_public then raise exception 'La versión pública cambió. Solicita una nueva propuesta.'; end if;
   if r.kind='withdraw' then delete from public.atlas_publications where exhibition_id=r.exhibition_id;
   else
    insert into public.atlas_publications(exhibition_id,revision_id,document,description,categories,author) values(r.exhibition_id,r.id,r.document,r.description,r.categories,r.author)
    on conflict(exhibition_id) do update set revision_id=excluded.revision_id,document=excluded.document,description=excluded.description,categories=excluded.categories,author=excluded.author,published_at=now();
   end if;
  end if;
  update public.atlas_revisions set state=decision,review_note=left(coalesce(payload->>'note',''),4000),reviewer_id=actor,reviewed_at=now(),updated_at=now() where id=r.id;
  insert into public.atlas_review_events(revision_id,actor_id,action,note) values(r.id,actor,decision,coalesce(payload->>'note',''));
  return jsonb_build_object('id',r.id,'state',decision);
 end if;
 -- Creating, saving and submitting share one transaction. Failure leaves the original draft intact.
 if action='propose' then
  if payload->>'id' is null then
   media:=atlas_private.command('create','{}'::jsonb);
   payload:=payload||jsonb_build_object('id',media->'id','expected_version',media->'lock_version');
  end if;
  media:=atlas_private.command('save',payload);
  return atlas_private.command('submit',jsonb_build_object('id',media->'id','expected_version',media->'lock_version','note',payload->>'note'));
 end if;
 if action='register_media' then
  media:=payload;asset:=media->>'id';
  if asset is null or asset !~ '^[a-f0-9]{64}$' then raise exception 'Archivo no válido'; end if;
  if not exists(select 1 from storage.objects where bucket_id='atlas-media' and name=actor::text||'/'||asset||'/full') or not exists(select 1 from storage.objects where bucket_id='atlas-media' and name=actor::text||'/'||asset||'/thumb') then raise exception 'Faltan archivos de la imagen'; end if;
  insert into public.atlas_media(owner_id,id,name,mime,width,height,kind) values(actor,asset,media->>'name',media->>'mime',(media->>'width')::integer,(media->>'height')::integer,media->>'kind') on conflict do nothing;
  return jsonb_build_object('id',asset);
 end if;
 if action='create' then
  insert into public.atlas_exhibitions(owner_id) values(actor) returning id into exhibition;
  insert into public.atlas_revisions(exhibition_id,owner_id,document,author) values(exhibition,actor,'{"schemaVersion":1,"title":"","blocks":[]}',profile.display_name) returning * into r;
  return to_jsonb(r);
 end if;
 if action not in ('fork','save','submit') then raise exception 'Acción desconocida'; end if;
 select * into r from public.atlas_revisions where id=(payload->>'id')::uuid for update;
 if r.id is null or r.owner_id<>actor then raise exception 'No puedes modificar una exposición ajena' using errcode='42501'; end if;
 perform 1 from public.atlas_exhibitions where id=r.exhibition_id for update;
 if action='fork' then
  if r.state in ('draft','submitted') then raise exception 'Termina la propuesta actual antes de abrir otra'; end if;
  select revision_id into current_public from public.atlas_publications where exhibition_id=r.exhibition_id;
  insert into public.atlas_revisions(exhibition_id,owner_id,document,description,categories,author,base_revision_id,kind)
  values(r.exhibition_id,actor,r.document,r.description,r.categories,r.author,current_public,case when payload->>'kind'='withdraw' and current_public is not null then 'withdraw' else 'publish' end) returning id into result_id;
  insert into public.atlas_revision_media select result_id,owner_id,asset_id from public.atlas_revision_media where revision_id=r.id;
  select * into r from public.atlas_revisions where id=result_id;return to_jsonb(r);
 end if;
 expected:=(payload->>'expected_version')::integer;
 if r.state<>'draft' or expected is null or r.lock_version<>expected then raise exception 'El borrador cambió o está en revisión. Recarga antes de continuar.' using errcode='40001'; end if;
 if action='save' then
  if not atlas_private.valid_document(payload->'document') then raise exception 'Documento de exposición no válido'; end if;
  if jsonb_typeof(coalesce(payload->'categories','[]'))<>'array' then raise exception 'Categorías no válidas'; end if;
  select coalesce(array_agg(value),'{}') into cats from jsonb_array_elements_text(coalesce(payload->'categories','[]'));
  if exists(select 1 from unnest(cats) x where length(x)>80) then raise exception 'Categoría demasiado larga'; end if;
  delete from public.atlas_revision_media where revision_id=r.id;
  for asset in select distinct value #>> '{}' from jsonb_path_query(payload->'document','strict $.**.assetId') as assets(value) loop
   if not exists(select 1 from public.atlas_media where owner_id=actor and id=asset) then raise exception 'Sube todas las imágenes antes de guardar'; end if;
   insert into public.atlas_revision_media values(r.id,actor,asset);
  end loop;
  update public.atlas_revisions set document=payload->'document',description=coalesce(payload->>'description',''),categories=cats,author=coalesce(payload->>'author',''),lock_version=lock_version+1,updated_at=now() where id=r.id returning * into r;
  return to_jsonb(r);
 end if;
 if action='submit' then
  if length(trim(coalesce(payload->>'note','')))<5 then raise exception 'Describe los cambios propuestos'; end if;
  if r.kind='publish' and (length(trim(r.document->>'title'))=0 or not(r.document ? 'location') or jsonb_array_length(r.document->'blocks')=0 or length(trim(r.author))=0) then raise exception 'Completa nombre, autor, ubicación y contenido antes de enviar'; end if;
  -- Remote images can change without review. Public proposals must use immutable uploaded assets.
  if r.kind='publish' and exists(select 1 from jsonb_path_query(r.document,'strict $.**.src')) then raise exception 'Para publicar, sube las imágenes al proyecto; las URL externas pueden cambiar sin revisión'; end if;
  update public.atlas_revisions set state='submitted',change_note=payload->>'note',submitted_at=now(),updated_at=now(),lock_version=lock_version+1 where id=r.id returning * into r;
  insert into public.atlas_review_events(revision_id,actor_id,action,note) values(r.id,actor,'submitted',r.change_note);
  return to_jsonb(r);
 end if;
 raise exception 'Acción desconocida';
end $$;
