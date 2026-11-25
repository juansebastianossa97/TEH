-- Extend the existing revision-scoped media lifecycle to PDF and Word documents.
alter table public.atlas_media drop constraint atlas_media_mime_check;
alter table public.atlas_media add constraint atlas_media_mime_check check (
 mime in ('image/png','image/jpeg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
);
alter table public.atlas_media drop constraint atlas_media_kind_check;
alter table public.atlas_media add constraint atlas_media_kind_check check (kind in ('photo','plan','document'));
alter table public.atlas_media add constraint atlas_media_document_type_check check (
 (kind='document') = (mime in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
);
update storage.buckets set allowed_mime_types=array['image/png','image/jpeg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] where id='atlas-media';
alter table public.atlas_revisions add constraint atlas_revisions_chronicle_check check (extensions.jsonb_matches_schema('{"type": "array", "maxItems": 5, "items": {"type": "object", "required": ["assetId", "name", "mime"], "additionalProperties": false, "properties": {"assetId": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "name": {"type": "string", "minLength": 1, "maxLength": 300}, "mime": {"enum": ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}}}}'::json, coalesce(document->'chronicle','[]'::jsonb)));
alter table public.atlas_publications add constraint atlas_publications_chronicle_check check (extensions.jsonb_matches_schema('{"type": "array", "maxItems": 5, "items": {"type": "object", "required": ["assetId", "name", "mime"], "additionalProperties": false, "properties": {"assetId": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "name": {"type": "string", "minLength": 1, "maxLength": 300}, "mime": {"enum": ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}}}}'::json, coalesce(document->'chronicle','[]'::jsonb)));
