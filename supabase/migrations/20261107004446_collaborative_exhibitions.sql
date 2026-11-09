-- Development collaboration foundation. All public mutations use audited RPCs.
create schema if not exists atlas_private;
revoke all on schema atlas_private from public;
grant usage on schema atlas_private to authenticated, anon;
create extension if not exists pg_jsonschema with schema extensions;
create function atlas_private.valid_document(d jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare n integer; ids integer; depth integer;
begin
 if d is null or octet_length(d::text)>2000000 then return false; end if;
 if not extensions.jsonb_matches_schema('{"type": "object", "properties": {"schemaVersion": {"const": 1}, "title": {"type": "string", "maxLength": 200}, "blocks": {"type": "array", "items": {"$ref": "#/definitions/block"}, "maxItems": 200}, "location": {"type": "object", "properties": {"lat": {"type": "number", "minimum": -90, "maximum": 90}, "lon": {"type": "number", "minimum": -180, "maximum": 180}, "label": {"type": "string", "maxLength": 500}, "provider": {"enum": ["manual", "photon"]}}, "required": ["lat", "lon", "label", "provider"]}}, "required": ["schemaVersion", "title", "blocks"], "definitions": {"asset": {"type": "object", "properties": {"assetId": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "src": {"type": "string", "maxLength": 3000, "pattern": "^(https://[^/@\\s]+[^\\s]*|/assets/[a-zA-Z0-9_./-]+(\\?v=[0-9]+)?)$"}, "alt": {"type": "string", "maxLength": 1000}, "caption": {"type": "string", "maxLength": 2000}, "title": {"type": "string", "maxLength": 300}, "label": {"type": "string", "maxLength": 100}, "author": {"type": "string", "maxLength": 1000}, "source": {"type": "string", "maxLength": 1000}, "sourceURL": {"anyOf": [{"type": "string", "maxLength": 3000, "pattern": "^(https://[^/@\\s]+[^\\s]*|/assets/[a-zA-Z0-9_./-]+(\\?v=[0-9]+)?)$"}, {"const": ""}]}, "kind": {"enum": ["photo", "plan"]}}, "required": ["alt"], "oneOf": [{"required": ["assetId"], "not": {"required": ["src"]}}, {"required": ["src"], "not": {"required": ["assetId"]}}]}, "block": {"oneOf": [{"type": "object", "properties": {"type": {"const": "heading"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "level": {"enum": [2, 3]}}, "required": ["type", "id", "title", "layout", "level"]}, {"type": "object", "properties": {"type": {"const": "hero"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "eyebrow": {"type": "string", "maxLength": 200}, "description": {"type": "string", "maxLength": 12000}, "cover": {"$ref": "#/definitions/asset"}}, "required": ["type", "id", "title", "layout", "eyebrow", "description"]}, {"type": "object", "properties": {"type": {"const": "section"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "description": {"type": "string", "maxLength": 12000}, "children": {"type": "array", "items": {"$ref": "#/definitions/block"}, "maxItems": 200}}, "required": ["type", "id", "title", "layout", "children"]}, {"type": "object", "properties": {"type": {"const": "text"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "body": {"type": "string", "maxLength": 12000}, "content": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"const": "doc"}}}]}}, "required": ["type", "id", "title", "layout"], "anyOf": [{"required": ["body"]}, {"required": ["content"]}]}, {"type": "object", "properties": {"type": {"const": "plates"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "items": {"type": "array", "items": {"$ref": "#/definitions/asset"}, "maxItems": 30}}, "required": ["type", "id", "title", "layout", "items"]}, {"type": "object", "properties": {"type": {"const": "comparison"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "items": {"type": "array", "items": {"$ref": "#/definitions/asset"}, "maxItems": 2}}, "required": ["type", "id", "title", "layout", "items"]}, {"type": "object", "properties": {"type": {"const": "timeline"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "description": {"type": "string", "maxLength": 12000}, "range": {"type": "string", "maxLength": 100}, "events": {"type": "array", "items": {"type": "object", "properties": {"date": {"type": "string", "maxLength": 100}, "era": {"type": "string", "maxLength": 200}, "title": {"type": "string", "maxLength": 500}, "body": {"type": "string", "maxLength": 12000}, "tags": {"type": "array", "items": {"type": "string", "maxLength": 80}, "maxItems": 12}, "source": {"type": "object", "properties": {"name": {"type": "string", "maxLength": 1000}, "url": {"anyOf": [{"type": "string", "maxLength": 3000, "pattern": "^(https://[^/@\\s]+[^\\s]*|/assets/[a-zA-Z0-9_./-]+(\\?v=[0-9]+)?)$"}, {"const": ""}]}}, "required": ["name", "url"]}}, "required": ["date", "era", "title", "body", "tags", "source"]}, "maxItems": 200}}, "required": ["type", "id", "title", "layout", "description", "range", "events"]}, {"type": "object", "properties": {"type": {"const": "sources"}, "id": {"type": "string", "maxLength": 200, "minLength": 1}, "title": {"type": "string", "maxLength": 500}, "layout": {"enum": ["reading", "wide", "two-columns", "three-columns"]}, "items": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string", "maxLength": 1000}, "url": {"anyOf": [{"type": "string", "maxLength": 3000, "pattern": "^(https://[^/@\\s]+[^\\s]*|/assets/[a-zA-Z0-9_./-]+(\\?v=[0-9]+)?)$"}, {"const": ""}]}}, "required": ["name", "url"]}, "maxItems": 100}}, "required": ["type", "id", "title", "layout", "items"]}]}, "rich": {"oneOf": [{"type": "object", "properties": {"type": {"const": "doc"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["paragraph", "heading", "bulletList", "orderedList", "blockquote"]}}}]}, "maxItems": 10000}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "paragraph"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["text", "hardBreak"]}}}]}, "maxItems": 10000}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "heading"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["text", "hardBreak"]}}}]}, "maxItems": 10000}, "attrs": {"type": "object", "properties": {"level": {"enum": [2, 3]}}, "required": ["level"]}}, "required": ["type", "attrs"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "bulletList"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["listItem"]}}}]}, "maxItems": 10000}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "orderedList"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["listItem"]}}}]}, "maxItems": 10000}, "attrs": {"type": "object", "properties": {"start": {"type": "integer", "minimum": 1, "maximum": 10000}}, "required": []}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "listItem"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["paragraph", "bulletList", "orderedList", "blockquote"]}}}]}, "maxItems": 10000}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "blockquote"}, "content": {"type": "array", "items": {"allOf": [{"$ref": "#/definitions/rich"}, {"properties": {"type": {"enum": ["paragraph", "heading", "bulletList", "orderedList"]}}}]}, "maxItems": 10000}}, "required": ["type"], "not": {"required": ["marks"]}}, {"type": "object", "properties": {"type": {"const": "text"}, "text": {"type": "string", "maxLength": 12000, "minLength": 1}, "marks": {"type": "array", "items": {"oneOf": [{"type": "object", "properties": {"type": {"enum": ["bold", "italic"]}}, "required": ["type"]}, {"type": "object", "properties": {"type": {"const": "link"}, "attrs": {"type": "object", "properties": {"href": {"type": "string", "maxLength": 3000, "pattern": "^https?://[^/@\\s]+[^\\s]*$"}}, "required": ["href"]}}, "required": ["type", "attrs"]}]}, "maxItems": 20}}, "required": ["type", "text"]}, {"type": "object", "properties": {"type": {"const": "hardBreak"}}, "required": ["type"]}]}}}'::json,d) then return false; end if;
 with recursive blocks(b,level) as (select value,0 from jsonb_array_elements(d->'blocks') union all select c.value,p.level+1 from blocks p cross join lateral jsonb_array_elements(coalesce(p.b->'children','[]'::jsonb)) c where p.level<7)
 select count(*),count(distinct b->>'id'),max(level) into n,ids,depth from blocks;
 return n<=500 and n=ids and coalesce(depth,0)<=5;
exception when others then return false;
end $$;
create table public.atlas_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),
 role text not null default 'visitor' check(role in ('visitor','editor','admin')),
 disabled boolean not null default false, created_at timestamptz not null default now()
);
create table atlas_private.admin_bootstrap (email text primary key, claimed_by uuid references auth.users(id), claimed_at timestamptz);
create table public.atlas_edit_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.atlas_profiles(id),
 reason text not null check(length(trim(reason)) between 10 and 2000),status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewer_id uuid references public.atlas_profiles(id),review_note text not null default '',created_at timestamptz not null default now(),reviewed_at timestamptz
);
create unique index atlas_one_request on public.atlas_edit_requests(user_id) where status='pending';
create index atlas_request_reviewer on public.atlas_edit_requests(reviewer_id);
create table public.atlas_exhibitions (id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.atlas_profiles(id),created_at timestamptz not null default now());
create index atlas_exhibition_owner on public.atlas_exhibitions(owner_id);
create table public.atlas_revisions (
 id uuid primary key default gen_random_uuid(), exhibition_id uuid not null references public.atlas_exhibitions(id),owner_id uuid not null references public.atlas_profiles(id),
 document jsonb not null check(atlas_private.valid_document(document)),
 description text not null default '' check(length(description)<=4000),categories text[] not null default '{}' check(cardinality(categories)<=20),author text not null default '' check(length(author)<=200),
 state text not null default 'draft' check(state in ('draft','submitted','approved','changes_requested','rejected')),
 kind text not null default 'publish' check(kind in ('publish','withdraw')),
 lock_version integer not null default 1,base_revision_id uuid references public.atlas_revisions(id),
 change_note text not null default '' check(length(change_note)<=4000),review_note text not null default '' check(length(review_note)<=4000),reviewer_id uuid references public.atlas_profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),submitted_at timestamptz,reviewed_at timestamptz
);
create unique index atlas_one_open_revision on public.atlas_revisions(exhibition_id) where state in ('draft','submitted');
create index atlas_revision_owner on public.atlas_revisions(owner_id);
create index atlas_revision_base on public.atlas_revisions(base_revision_id);
create index atlas_revision_reviewer on public.atlas_revisions(reviewer_id);
create index atlas_revision_state on public.atlas_revisions(state,submitted_at);
create table public.atlas_publications (
 exhibition_id uuid primary key references public.atlas_exhibitions(id),revision_id uuid not null unique references public.atlas_revisions(id),
 document jsonb not null,description text not null,categories text[] not null,author text not null,published_at timestamptz not null default now()
);
create table public.atlas_media (
 owner_id uuid not null references public.atlas_profiles(id),id text not null check(id ~ '^[a-f0-9]{64}$'),
 name text not null check(length(name)<=300),mime text not null check(mime in ('image/png','image/jpeg','image/webp')),
 width integer not null check(width between 1 and 3200),height integer not null check(height between 1 and 3200),kind text not null check(kind in ('photo','plan')),
 primary key(owner_id,id)
);
create table public.atlas_revision_media (
 revision_id uuid not null references public.atlas_revisions(id),owner_id uuid not null,asset_id text not null,
 primary key(revision_id,asset_id),foreign key(owner_id,asset_id) references public.atlas_media(owner_id,id)
);
create index atlas_media_reference on public.atlas_revision_media(owner_id,asset_id);
create table public.atlas_review_events (
 id bigint generated always as identity primary key,revision_id uuid not null references public.atlas_revisions(id),actor_id uuid not null references public.atlas_profiles(id),
 action text not null,note text not null,created_at timestamptz not null default now()
);
create index atlas_events_revision on public.atlas_review_events(revision_id);
create index atlas_events_actor on public.atlas_review_events(actor_id);

create function atlas_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.atlas_profiles p where p.id=auth.uid() and p.role='admin' and not p.disabled)
$$;
create function atlas_private.is_editor() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.atlas_profiles p where p.id=auth.uid() and p.role in ('editor','admin') and not p.disabled)
$$;
create function atlas_private.can_read_revision(r uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (atlas_private.is_admin() or exists(select 1 from public.atlas_revisions v join public.atlas_profiles p on p.id=v.owner_id where v.id=r and v.owner_id=auth.uid() and not p.disabled))
$$;
create function atlas_private.can_read_media(o uuid,a text) returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid() is not null and (atlas_private.is_admin() or (auth.uid()=o and atlas_private.is_editor()))) or exists(select 1 from public.atlas_revision_media m join public.atlas_publications p on p.revision_id=m.revision_id where m.owner_id=o and m.asset_id=a)
$$;

alter table public.atlas_profiles enable row level security;
alter table atlas_private.admin_bootstrap enable row level security;
alter table public.atlas_edit_requests enable row level security;
alter table public.atlas_exhibitions enable row level security;
alter table public.atlas_revisions enable row level security;
alter table public.atlas_publications enable row level security;
alter table public.atlas_media enable row level security;
alter table public.atlas_revision_media enable row level security;
alter table public.atlas_review_events enable row level security;
create policy atlas_profile_read on public.atlas_profiles for select to authenticated using(id=(select auth.uid()) or (select atlas_private.is_admin()));
create policy atlas_request_read on public.atlas_edit_requests for select to authenticated using(user_id=(select auth.uid()) or (select atlas_private.is_admin()));
create policy atlas_exhibition_read on public.atlas_exhibitions for select to authenticated using((owner_id=(select auth.uid()) and (select atlas_private.is_editor())) or (select atlas_private.is_admin()));
create policy atlas_revision_read on public.atlas_revisions for select to authenticated using(atlas_private.can_read_revision(id));
create policy atlas_published_read on public.atlas_publications for select to anon,authenticated using(true);
create policy atlas_media_read on public.atlas_media for select to anon,authenticated using(atlas_private.can_read_media(owner_id,id));
create policy atlas_refs_read on public.atlas_revision_media for select to anon,authenticated using(atlas_private.can_read_revision(revision_id) or exists(select 1 from public.atlas_publications p where p.revision_id=atlas_revision_media.revision_id));
create policy atlas_events_read on public.atlas_review_events for select to authenticated using(atlas_private.can_read_revision(revision_id));
revoke all on public.atlas_profiles,public.atlas_edit_requests,public.atlas_exhibitions,public.atlas_revisions,public.atlas_publications,public.atlas_media,public.atlas_revision_media,public.atlas_review_events from anon,authenticated;
grant select on public.atlas_profiles,public.atlas_edit_requests,public.atlas_exhibitions,public.atlas_revisions,public.atlas_review_events to authenticated;
grant select on public.atlas_publications,public.atlas_media,public.atlas_revision_media to anon,authenticated;

-- No replace/delete policies: uploaded files and submitted snapshots cannot be overwritten.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('atlas-media','atlas-media',false,26214400,array['image/png','image/jpeg','image/webp']);
create policy atlas_upload on storage.objects for insert to authenticated with check(bucket_id='atlas-media' and (select atlas_private.is_editor()) and name ~ ('^'||(select auth.uid())::text||'/[a-f0-9]{64}/(full|thumb)$'));
create policy atlas_download on storage.objects for select to anon,authenticated using(bucket_id='atlas-media' and case when name ~ '^[a-f0-9-]{36}/[a-f0-9]{64}/(full|thumb)$' then atlas_private.can_read_media(split_part(name,'/',1)::uuid,split_part(name,'/',2)) else false end);

-- Single mutation boundary. The exposed wrapper is SECURITY INVOKER.
-- Privileged implementation is private and checks identity/role on every action.
create function atlas_private.command(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
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
 if action='request_edit' then
  if profile.role<>'visitor' then raise exception 'Tu cuenta ya tiene permiso de edición'; end if;
  insert into public.atlas_edit_requests(user_id,reason) values(actor,payload->>'reason') returning id into result_id;
  return jsonb_build_object('id',result_id);
 end if;
 if action='review_request' then
  if profile.role<>'admin' then raise exception 'Solo el administrador puede aprobar solicitudes' using errcode='42501'; end if;
  select * into req from public.atlas_edit_requests where id=(payload->>'id')::uuid for update;
  decision:=payload->>'decision';
  if req.id is null or req.status<>'pending' or decision not in ('approved','rejected') then raise exception 'Solicitud o decisión no válida'; end if;
  if decision='approved' then update public.atlas_profiles set role='editor' where id=req.user_id and role='visitor' and not disabled; end if;
  update public.atlas_edit_requests set status=decision,reviewer_id=actor,review_note=left(coalesce(payload->>'note',''),4000),reviewed_at=now() where id=req.id;
  return jsonb_build_object('id',req.id);
 end if;
 if action='set_permission' then
  if profile.role<>'admin' then raise exception 'Solo el administrador puede gestionar permisos' using errcode='42501'; end if;
  select * into target from public.atlas_profiles where id=(payload->>'id')::uuid for update;
  if target.id is null or target.role='admin' or target.id=actor or payload->>'role' not in ('visitor','editor') then raise exception 'No se puede modificar esa cuenta desde aquí'; end if;
  update public.atlas_profiles set role=payload->>'role',disabled=coalesce((payload->>'disabled')::boolean,false) where id=target.id;
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
 if profile.role not in ('editor','admin') then raise exception 'Necesitas permiso de edición aprobado' using errcode='42501'; end if;
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
  for asset in select distinct value #>> '{}' from jsonb_path_query(payload->'document','strict $.**.assetId') loop
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
create function public.atlas_command(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select atlas_private.command(action,payload) $$;
revoke all on all functions in schema atlas_private from public,anon,authenticated;
grant execute on function atlas_private.is_admin(),atlas_private.is_editor(),atlas_private.can_read_revision(uuid),atlas_private.can_read_media(uuid,text) to anon,authenticated;
grant execute on function atlas_private.command(text,jsonb) to authenticated;
revoke all on function public.atlas_command(text,jsonb) from public,anon;
grant execute on function public.atlas_command(text,jsonb) to authenticated;
-- These tables have no direct write grants, including profiles and role assignments.
