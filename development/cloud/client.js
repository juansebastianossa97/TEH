import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
import {assetReferences,getAsset,putAssets,hashBlob} from '../tools/assets.js';
import {validateDocument} from '../blocks/model.js';
export const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const BUCKET='atlas-media';
export async function checked(promise){const {data,error}=await promise;if(error)throw Error(error.message);return data}
export const command=(action,payload={})=>checked(supabase.rpc('atlas_command',{action,payload}));
export async function profile(){const {data:{user}}=await supabase.auth.getUser();return user?command('session'):null}
export async function uploadAssets(doc,onProgress=()=>{}){
 const user=await checked(supabase.auth.getUser());if(!user.user)throw Error('Inicia sesión para guardar en la nube.');
 const ids=assetReferences(doc);
 if(!ids.length)return;
 const uploaded=await checked(supabase.from('atlas_media').select('id').eq('owner_id',user.user.id).in('id',ids));
 const existing=new Set(uploaded.map(row=>row.id));
 for(const [index,id] of ids.entries()){
  if(existing.has(id))continue;
  onProgress(`Subiendo imagen ${index+1} de ${ids.length}…`);const record=await getAsset(id);if(!record)throw Error('Falta una imagen local: restaura el ZIP antes de guardar.');
  if(await hashBlob(record.blob)!==id)throw Error('La imagen local no coincide con su identificador.');
  const path=`${user.user.id}/${id}`;
  for(const [variant,blob] of [['full',record.blob],['thumb',record.thumbnail]]){
   const {error}=await supabase.storage.from(BUCKET).upload(`${path}/${variant}`,blob,{upsert:false,contentType:blob.type,cacheControl:'3600'});
   if(error&&String(error.statusCode)!=='409')throw Error(error.message);
  }
  await command('register_media',{id,name:record.name,mime:record.blob.type,width:record.width,height:record.height,kind:record.kind});
 }
}
export async function hydrate(doc,revisionId,onProgress=()=>{}){
 const errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 const refs=await checked(supabase.from('atlas_revision_media').select('asset_id,owner_id').eq('revision_id',revisionId));
 const records=[];for(const [index,id] of assetReferences(doc).entries()){
  if(await getAsset(id))continue;const ref=refs.find(r=>r.asset_id===id);if(!ref)throw Error('Falta una referencia de imagen.');
  onProgress(`Recuperando imagen ${index+1}…`);
  const metadata=await checked(supabase.from('atlas_media').select('*').eq('owner_id',ref.owner_id).eq('id',id).single());
  const path=`${ref.owner_id}/${id}`;const [blob,thumbnail]=await Promise.all(['full','thumb'].map(v=>checked(supabase.storage.from(BUCKET).download(`${path}/${v}`))));
  if(await hashBlob(blob)!==id)throw Error('La imagen almacenada no supera la verificación de integridad.');
  records.push({...metadata,blob,thumbnail});
 }
 await putAssets(records);return doc;
}
export const revision=id=>checked(supabase.from('atlas_revisions').select('*').eq('id',id).single());
export async function saveCloud(doc,current,metadata,onProgress){
 const errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 await uploadAssets(doc,onProgress);
 if(!current)current=await command('create');
 return command('save',{id:current.id,expected_version:current.lock_version,document:doc,...metadata});
}
