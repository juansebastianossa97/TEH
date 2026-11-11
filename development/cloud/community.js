import {checkSophiaSubmission} from '../blocks/sophia-template.js';
import {setupRecovery} from './recovery.js';
import {setupAuthMode} from './auth-mode.js';
import './password-toggle.js';
import {supabase,profile,checked,command} from './client.js';
import {$,el,status,run,button,link,states,ask} from './ui.js';
let me;
const authMode=setupAuthMode(document, new URLSearchParams(location.search).get('modo') === 'registro');
const recovery=setupRecovery({auth:supabase.auth,status,run,checked});
const editorURL=id=>`/dev/?revision=${id}`;
function card(title){const c=el('article',undefined,'card');c.append(el('h3',title));return c}
async function refresh(){
 me=await profile();$('#auth').hidden=!!me;$('#account').hidden=!me;$('#signout').hidden=!me;
 if(!me){status('Explora libremente o entra para contribuir.');return}
 $('#identity').textContent=me.display_name;
 $('#permission').textContent=me.role==='admin'?'Administrador · Revisa las propuestas antes de publicarlas.':'Puedes preparar y enviar tus propuestas.';
 $('#workspace').hidden=false;$('#admin').hidden=me.role!=='admin';
 {
  const rows=await checked(supabase.from('atlas_revisions').select('*').eq('owner_id',me.id).order('updated_at',{ascending:false}).limit(200));
  $('#mine').replaceChildren(...rows.map(r=>{const c=card(r.document.title||'Exposición sin título'),actions=el('div',undefined,'actions');c.append(el('span',states[r.state],'badge'),el('p',r.kind==='withdraw'?'Solicitud de retirada':r.description||'Sin descripción'));if(r.review_note)c.append(el('p','Comentario: '+r.review_note));
   actions.append(link('Ver versión',`/dev/review.html?id=${r.id}`));
   if(r.state==='draft'){actions.append(link('Editar',editorURL(r.id)),button('Enviar a revisión',async()=>{if(r.kind!=='withdraw')checkSophiaSubmission(r.document);const note=await ask('Describe qué quieres publicar o cambiar');if(note===null)return;await command('submit',{id:r.id,expected_version:r.lock_version,note});await refresh();status('Propuesta enviada. Esta versión ya no se puede editar.')}))}
   else if(r.state!=='submitted'&&!rows.some(x=>x.exhibition_id===r.exhibition_id&&['draft','submitted'].includes(x.state))){actions.append(button('Preparar cambios',async()=>{const next=await command('fork',{id:r.id});location.href=editorURL(next.id)}));if(r.state==='approved')actions.append(button('Solicitar retirada',async()=>{const note=await ask('Explica por qué debe retirarse del mapa');if(note===null)return;const next=await command('fork',{id:r.id,kind:'withdraw'});await command('submit',{id:next.id,expected_version:next.lock_version,note});await refresh()}))}
   c.append(actions);return c}));if(!rows.length)$('#mine').append(el('p','Tu primera exposición empieza aquí.'));
 }
 if(me.role==='admin'){
  const users=await checked(supabase.from('atlas_profiles').select('*').order('created_at'));const names=new Map(users.map(u=>[u.id,u.display_name]));
  const queue=await checked(supabase.from('atlas_revisions').select('id,document,owner_id,kind,change_note,submitted_at').eq('state','submitted').order('submitted_at'));
  $('#pending-reviews').replaceChildren(...queue.map(r=>{const c=card(r.document.title||'Sin título');c.append(el('p',`${names.get(r.owner_id)||'Autor'} · ${r.kind==='withdraw'?'Retirada':'Publicación'}`),el('p',r.change_note),link('Revisar y comparar',`/dev/review.html?id=${r.id}`));return c}));if(!queue.length)$('#pending-reviews').append(el('p','No hay propuestas pendientes.'));
  $('#users').replaceChildren(...users.map(u=>{
   const c=card(u.display_name);
   c.append(el('p',u.role==='admin'?'Administrador':u.disabled?'Cuenta suspendida':'Cuenta registrada'));
   if(u.role!=='admin'){
    const label=u.disabled?'Reactivar cuenta':'Suspender cuenta';
    c.append(button(label,async()=>{
     if(await ask(label+' de '+u.display_name+'?',{required:false})===null)return;
     await command('set_permission',{id:u.id,disabled:!u.disabled});
     await refresh();
    }));
   }
   return c;
  }));
 }
 status('Tu espacio está actualizado.');
}
$('#auth-form').onsubmit=e=>{e.preventDefault();run(async()=>{
 if(authMode.isSignup()){
  if(!$('#name').value.trim())throw Error('Escribe tu nombre para crear la cuenta.');
  await checked(supabase.auth.signUp({email:$('#email').value.trim(),password:$('#password').value,options:{data:{display_name:$('#name').value.trim()},emailRedirectTo:`${location.origin}/dev/community.html`}}));
  $('#password').value='';authMode.showLogin();status('Revisa tu correo y confirma la cuenta. Después entra con tu correo y contraseña.');
 }else{
  await checked(supabase.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value}));
  $('#password').value='';await refresh();
 }
})};
$('#signout').onclick=()=>run(async()=>{await checked(supabase.auth.signOut());await refresh()});
$('#create').onclick=()=>run(async()=>{const r=await command('create');location.href=editorURL(r.id)});
await run(async()=>{if(!await recovery.start())await refresh();});

$('#import-originals').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  const progress = $('#import-progress');
  try {
    const rows = await checked(supabase.from('atlas_original_places').select('document'));
    if (rows.length !== 7) throw Error('Se esperaban siete lugares.');
    const files = rows.flatMap(({document: p}) => [p.main + '.jpg', p.second + '.jpg']);
    files.push('sophia-vacios.svg', 'sophia-llenos.svg', 'sophia-nolli.svg');
    const bucket = supabase.storage.from('atlas-originals');
    for (const [i, name] of files.entries()) {
      progress.textContent = (i+1) + ' / ' + files.length + ' · ' + name;
      const source = await fetch('https://teoriahistoria.vercel.app/assets/' + encodeURIComponent(name));
      if (!source.ok) throw Error('No se pudo leer ' + name + ' desde Vercel.');
      const blob = await source.blob();
      const upload = await bucket.upload(name, blob, {contentType:blob.type});
      const copy = await fetch(bucket.getPublicUrl(name).data.publicUrl);
      if (!copy.ok) throw Error(upload.error?.message || 'No se pudo verificar ' + name);
      const original = new Uint8Array(await blob.arrayBuffer());
      const saved = new Uint8Array(await copy.arrayBuffer());
      if (original.length !== saved.length || !original.every((v,j)=>v===saved[j])) {
        throw Error('El archivo en Storage difiere del original: ' + name);
      }
    }
    progress.textContent = '17 imágenes verificadas en Supabase.';
  } catch(error) { progress.textContent = error.message; }
  finally { button.disabled = false; }
};
