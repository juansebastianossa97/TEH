import {supabase,checked,profile,revision,hydrate,command} from './client.js';
import {renderDocument} from '../blocks/render.js';
import {$,el,button,status,run,ask,states} from './ui.js';
await run(async()=>{
 const me=await profile();if(!me)throw Error('Inicia sesión en Comunidad para revisar esta versión.');
 const r=await revision(new URLSearchParams(location.search).get('id'));$('#title').textContent=r.document.title||'Exposición sin título';
 $('#summary').append(el('span',states[r.state],'badge'),el('p',r.kind==='withdraw'?'Se propone retirar esta exposición del mapa.':'Propuesta de publicación'),el('p',r.change_note||'Todavía es un borrador.'),el('p',r.review_note||''));
 const published=await checked(supabase.from('atlas_publications').select('*').eq('exhibition_id',r.exhibition_id).maybeSingle());
 if(published)renderDocument(await hydrate(published.document,published.revision_id,status),$('#before'));else $('#before').textContent='Esta exposición no tiene una versión pública.';
 renderDocument(await hydrate(r.document,r.id,status),$('#after'));
 const old={document:published?.document,description:published?.description,categories:published?.categories,author:published?.author},next={document:r.document,description:r.description,categories:r.categories,author:r.author};
 const oldLines=JSON.stringify(old,null,2).split('\n'),newLines=JSON.stringify(next,null,2).split('\n');
 const beforeSet=new Set(oldLines),afterSet=new Set(newLines);for(const line of oldLines.filter(l=>!afterSet.has(l)))$('#diff').append(el('del','− '+line+'\n'));for(const line of newLines.filter(l=>!beforeSet.has(l)))$('#diff').append(el('ins','+ '+line+'\n'));$('#diff').prepend(el('p','Resumen por líneas; compara las vistas completas para revisar el orden y las imágenes.'));
 if(me.role==='admin'&&r.state==='submitted')for(const [label,decision] of [[r.kind==='withdraw'?'Aprobar retirada':'Aprobar y publicar','approved'],['Pedir correcciones','changes_requested'],['Rechazar','rejected']])$('#decisions').append(button(label,async()=>{const note=await ask(label+' · Comentario para el autor',{required:decision!=='approved'});if(note===null)return;await command('review',{id:r.id,decision,note});location.reload()}));
 const events=await checked(supabase.from('atlas_review_events').select('*').eq('revision_id',r.id).order('created_at'));$('#history').replaceChildren(...events.map(e=>el('p',`${new Date(e.created_at).toLocaleString('es-CO')} · ${states[e.action]||e.action} · ${e.note}`)));
 status(r.state==='submitted'?'Propuesta congelada: se aprobará exactamente esta versión.':'Versión recuperada.');
});
