import {newSophiaDocument,checkSophiaSubmission} from '../blocks/sophia-template.js';
import {profile,revision,hydrate,prepareProposal,saveCloud,uploadAssets,command} from './client.js';
export async function connectCloudEditor({getDocument,setDocument,confirm,message,busy}){
 let current=null;
 const save=document.querySelector('#cloud-save');
 document.addEventListener('atlas:replace-local',()=>{current=null});
 function metadataDialog(me){return new Promise(resolve=>{const dialog=document.createElement('dialog'),form=document.createElement('form'),heading=document.createElement('h2');dialog.className='cloud-metadata';heading.textContent=current?'Guardar cambios en mi borrador':'Crear borrador en la nube';form.append(heading);const fields={};for(const [key,label,value] of [['author','Autor',current?.author||me.display_name],['description','Descripción',current?.description||''],['categories','Categorías separadas por comas',current?.categories?.join(', ')||'']]){const l=document.createElement('label'),input=document.createElement(key==='description'?'textarea':'input');l.textContent=label;input.value=value;input.maxLength=key==='description'?4000:key==='author'?200:1600;input.required=key==='author';l.append(input);form.append(l);fields[key]=input}const note=document.createElement('p');note.textContent='Puedes seguir editando este borrador hasta que pulses Enviar a revisión.';form.append(note);const cancel=document.createElement('button'),ok=document.createElement('button');cancel.textContent='Cancelar';cancel.type='button';cancel.onclick=()=>dialog.close();ok.textContent='Guardar en la nube';form.append(cancel,ok);form.onsubmit=e=>{e.preventDefault();dialog.returnValue='save';dialog.close()};dialog.append(form);document.body.append(dialog);dialog.onclose=()=>{resolve(dialog.returnValue==='save'?{author:fields.author.value,description:fields.description.value,categories:fields.categories.value.split(',').map(s=>s.trim()).filter(Boolean)}:null);dialog.remove()};dialog.showModal()})}
 save.onclick=async()=>{busy(true);try{const me=await profile();if(!me)throw Error('Inicia sesión en Comunidad para guardar tu borrador.');const metadata=await metadataDialog(me);if(!metadata)return;current=await saveCloud(getDocument(),current,metadata,message);history.replaceState(null,'',`/dev/?revision=${current.id}`);message('Borrador guardado en la nube. Puedes enviarlo desde este editor.')}catch(e){message(e.message,true)}finally{busy(false)}};
 const send=document.querySelector('#send-proposal');
 send.onclick=async()=>{
  if(send.disabled)return;
  send.disabled=true;busy(true);
  try{
   const me=await profile();
   if(!me)throw Error('Inicia sesión en Comunidad para enviar tu propuesta.');
   checkSophiaSubmission(getDocument());
   const doc=await prepareProposal(getDocument());
   if(!doc.title.trim()||!doc.blocks.length||!doc.location)throw Error('Añade un nombre, contenido y ubicación antes de enviar.');
   message('Guardando las imágenes de tu propuesta…');
   await uploadAssets(doc,message);
   const row=await command('propose',{
    id:current?.id,expected_version:current?.lock_version,document:doc,
    author:current?.author||me.display_name,description:current?.description||'',
    categories:current?.categories||[],note:'Propuesta de '+me.display_name+' · '+doc.title
   });
   location.assign('/dev/review.html?id='+row.id);
  }catch(error){message(error.message,true)}
  finally{send.disabled=false;busy(false)}
 };
 const id=new URLSearchParams(location.search).get('revision');if(!id)return;
 busy(true);try{await profile();const row=await revision(id);if(row.state!=='draft')throw Error('Esta versión está congelada. Revísala desde Mis exposiciones.');if(!await confirm('¿Abrir este borrador de la nube en el editor? Exporta antes tu borrador local si quieres conservarlo.'))return;await hydrate(row.document,row.id,message);const document = structuredClone(row.document);
 if (!document.blocks.length) document.blocks = newSophiaDocument().blocks;
 setDocument(document);current=row;message('Borrador de la nube abierto. Cuando termines, pulsa Enviar a revisión.')}catch(e){message(e.message,true)}finally{busy(false)}
}
