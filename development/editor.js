import {newSophiaDocument,isSophiaDocument,plateLabels} from './blocks/sophia-template.js';
import {connectCloudEditor} from './cloud/editor-bridge.js';
import {runTask} from './tools/worker-client.js';
import {mountRichEditor} from './tools/rich-editor.js';
import {enableImageDrag} from './tools/image-drag.js';
import {mountMedia} from './tools/media-editor.js';
import {clearAssetURLs,missingAssets} from './tools/assets.js';
import {restoreBackup} from './tools/backup.js';
import {mountLocation,previewDraftMap} from './tools/location.js';
import {clone,uid,duplicateBlock,validateDocument,findBlock,moveBlock,removeBlock,newBlock,saveDraft,loadDraft,MAX_BYTES} from './blocks/model.js';
import {renderDocument} from './blocks/render.js';
const $=s=>document.querySelector(s);
const icons={heading:'H',hero:'◧',section:'≡',text:'T',plates:'▧',timeline:'◷',comparison:'◫',sources:'↗'};
const descriptions={heading:'Solo un título. Nada más es obligatorio.',hero:'La primera impresión de tu exposición.',section:'Agrupa las piezas de tu historia.',text:'Dale voz a lo que quieres contar.',plates:'Imágenes, planos y sus detalles.',timeline:'Conecta los momentos de la historia.',comparison:'Dos miradas, una misma obra.',sources:'Las referencias que acompañan tu relato.'};
const labels={heading:'Título',hero:'Portada',section:'Sección',text:'Texto',plates:'Láminas',timeline:'Línea de tiempo',comparison:'Comparación',sources:'Fuentes'};
let doc,selected,revision=0,timer,dirty=false,richEditor;
function busy(on){document.querySelector('.studio-context').inert=on;document.querySelector('#editor-workspace').inert=on;document.querySelector('.toolbar').inert=on;}
const message=(value,error=false)=>{$('#save-status').textContent=value;$('#save-status').classList.toggle('error',error)};
const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function markSelection(){for(const node of $('#preview').querySelectorAll('[data-block-id]'))node.classList.toggle('is-selected',node.dataset.blockId===selected)}
function selectBlock(id,scroll=true){selected=id;document.body.classList.remove('inspector-hidden');$('#inspector-toggle').setAttribute('aria-expanded','true');if(innerWidth<=960){document.body.classList.add('outline-hidden');$('#outline-toggle').setAttribute('aria-expanded','false')}refreshOutline();fields();markSelection();if(scroll){const node=[...$('#preview').querySelectorAll('[data-block-id]')].find(n=>n.dataset.blockId===id);node?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}
function coverSlot(container,block,key,canvas){
 const label=key==='cover'?'Imagen de portada 1':'Imagen de portada 2';
 const slot={type:'hero',cover:block[key]};
 mountMedia(container,slot,{input,action,refresh:fields,message,busy,locked:true,canvas,coverLabel:label,changed:()=>{
  if(slot.cover)block[key]=slot.cover;
  else delete block[key];
  selected=block.id;changed();
 }});
}
function templateSlots(node,b){
 delete node.dataset.empty;
 if(b.type==='hero'){
  let grid=node.querySelector('.cover-pair');
  if(!grid){grid=element('div');grid.className='cover-pair';node.insertBefore(grid,node.querySelector('nav'))}
  for(const key of ['cover','secondCover']){
   const tile=grid.querySelector('[data-cover-key="'+key+'"]');
   if(tile)grid.append(tile);else coverSlot(grid,b,key,true);
  }
  return;
 }
 const plans=b.type==='plates';
 let grid=plans?node.querySelector('.media-grid'):node;
 if(!grid){grid=element('div');node.append(grid)}
 const figures=plans?[...grid.children]:[];
 if(plans){grid.className='template-slots';grid.removeAttribute('style')}
 for(const label of plans?plateLabels:['']){
  const index=plans?b.items.findIndex(item=>item.label===label):-1;
  if(plans&&index>=0){grid.append(figures[index]);continue}
  if(!plans&&b.cover)continue;
  const slot=plans?{type:'hero'}:b;
  mountMedia(grid,slot,{canvas:true,plateLabel:label,input,action,busy,message,refresh:fields,changed:()=>{
   if(plans){b.items.push({...slot.cover,label});b.items.sort((a,c)=>plateLabels.indexOf(a.label)-plateLabels.indexOf(c.label))}
   selected=b.id;changed();
  }});
 }
}
function renderCanvas(){renderDocument(doc,$('#preview'));for(const node of $('#preview').querySelectorAll('[data-block-id]')){const block=findBlock(doc.blocks,node.dataset.blockId);const button=element('button');button.textContent='✎ Editar '+labels[block.type].toLowerCase();if(isSophiaDocument(doc)&&['hero','plates'].includes(block.type)){templateSlots(node,block)}else if(node.dataset.empty){const hint=element('span',labels[block.type]+' vacío · pulsa Editar para empezar');hint.className='empty-block-hint';node.append(hint)}button.className='edit-block-button';button.type='button';button.addEventListener('click',()=>selectBlock(block.id,false));node.append(button)}markSelection()}
enableImageDrag($('#preview'),{
 getBlock:id=>isSophiaDocument(doc)?null:findBlock(doc.blocks,id),
 commit:id=>{changed();selectBlock(id,false)},
 redraw:renderCanvas
});
function confirmChange(text){return new Promise(resolve=>{const dialog=element('dialog'),form=element('form'),body=element('p',text);form.method='dialog';dialog.className='editor-confirm';form.append(body);for(const [value,label] of [['cancel','Cancelar'],['accept','Continuar']]){const button=element('button',label);button.value=value;form.append(button)}dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='accept';dialog.remove();resolve(accepted)},{once:true});dialog.showModal()})}
function persist(){clearTimeout(timer);try{const record=saveDraft(localStorage,doc,revision);revision=record.revision;dirty=false;message(`Guardado en este navegador · ${new Date(record.savedAt).toLocaleTimeString('es-CO')}`);return true}catch(e){message(e.message,true);return false}}
function changed(){dirty=true;message('Cambios pendientes de guardar…');clearTimeout(timer);timer=setTimeout(persist,800);refreshOutline();try{renderCanvas()}catch(e){message(e.message,true)}}
function replaceDocument(next){document.dispatchEvent(new Event('atlas:replace-local'));clearTimeout(timer);clearAssetURLs();doc=clone(next);selected=doc.blocks[0]?.id;$('#document-title').value=doc.title;refreshOutline();fields();renderCanvas()}
function refreshOutline(){
 const fixed=isSophiaDocument(doc);
 $('.add-block-panel').hidden=fixed;
 $('.outline-panel .panel-heading p').textContent=fixed?'Plantilla':'Organiza tu historia, bloque a bloque.';
 const root=$('#outline');root.replaceChildren();
 function walk(blocks,parent){for(const b of blocks){const li=element('li'),row=element('div'),pick=element('button');pick.setAttribute('aria-label',`${labels[b.type]} · ${b.title||'Sin título'}`);const icon=element('span',icons[b.type]);icon.className='block-icon';icon.setAttribute('aria-hidden','true');const copy=element('span');copy.className='outline-copy';const kind=element('span',labels[b.type]);kind.className='outline-kind';const name=element('span',b.title||'Sin título');name.className='outline-name';copy.append(kind,name);pick.append(icon,copy);pick.className=b.id===selected?'selected':'';pick.setAttribute('aria-pressed',String(b.id===selected));pick.addEventListener('click',()=>selectBlock(b.id));row.append(pick);
  if (!fixed) for(const [delta,name] of [[-1,'Subir'],[1,'Bajar']]){const button=element('button',delta===-1?'↑':'↓');button.setAttribute('aria-label',`${name} ${b.title||labels[b.type]}`);button.disabled=blocks.indexOf(b)+delta<0||blocks.indexOf(b)+delta>=blocks.length;button.addEventListener('click',()=>{doc=moveBlock(doc,b.id,delta);changed();fields()});row.append(button)}
  // DnD constrained to siblings to preserve hierarchy. Keyboard buttons are equivalent.
  li.draggable=!fixed;li.addEventListener('dragstart',e=>{e.stopPropagation();e.dataTransfer.setData('text/plain',b.id)});row.addEventListener('dragover',e=>e.preventDefault());row.addEventListener('drop',e=>{if(fixed)return;e.preventDefault();e.stopPropagation();const id=e.dataTransfer.getData('text/plain'),from=blocks.findIndex(item=>item.id===id),to=blocks.indexOf(b);if(from<0||from===to)return;doc=moveBlock(doc,id,to-from);changed();fields()});
  li.append(row);if(b.children){const list=element('ol');walk(b.children,list);li.append(list)}parent.append(li);
 }}walk(doc.blocks,root);
 $('#block-count').textContent=root.querySelectorAll('li').length;
 $('#add-child').disabled=findBlock(doc.blocks,selected)?.type!=='section';
}
function input(container,label,value,callback,{large=false,type='text'}={}){const wrapper=element('label',label),field=element(large?'textarea':'input');if(!large)field.type=type;field.value=value??'';field.addEventListener('input',()=>{callback(field.value);changed()});wrapper.append(field);container.append(wrapper);return field}
function eventCategories(container, event) {
  const fixed = ['Arquitectura', 'Arte', 'Economía', 'Patrimonio', 'Política', 'Sociedad'];
  const menu = element('details');
  const summary = element('summary');
  const updateLabel = () => {
    summary.textContent = event.tags.length ? 'Categorías · ' + event.tags.join(', ') : 'Elegir categorías';
  };
  updateLabel();
  menu.append(summary);
  for (const category of new Set([...fixed, ...event.tags])) {
    const label = element('label');
    const box = element('input');
    box.type = 'checkbox';
    box.checked = event.tags.includes(category);
    box.addEventListener('change', () => {
      event.tags = box.checked ? [...event.tags, category] : event.tags.filter(tag => tag !== category);
      updateLabel();
      changed();
    });
    label.className = 'event-category-option';
    label.append(box, category);
    menu.append(label);
  }
  container.append(menu);
}
function select(container,label,value,options,callback){const wrapper=element('label',label),field=element('select');for(const [val,name] of options){const option=element('option',name);option.value=val;field.append(option)}field.value=value;field.addEventListener('change',()=>{callback(field.value);changed()});wrapper.append(field);container.append(wrapper)}
function action(container,name,callback){const button=element('button',name);button.type='button';button.addEventListener('click',callback);container.append(button);return button}
function fields(){richEditor?.destroy();richEditor=null;const root=$('#block-fields');root.replaceChildren();const b=findBlock(doc.blocks,selected);if(!b){$('#settings-title').textContent='Empieza tu exposición';$('#selected-description').textContent='Añade un bloque desde la estructura.';root.append(element('p','Selecciona o añade un bloque.'));return}
 $('#settings-title').textContent=labels[b.type];$('#selected-description').textContent=descriptions[b.type];
 const titleInput=input(root,b.type==='heading'?'Texto del título':isSophiaDocument(doc)&&b.type!=='plates'?'Título':'Título (opcional)',b.title,v=>b.title=v,{large:b.type==='hero'||b.type==='timeline'});titleInput.placeholder=b.type==='heading'?'Por ejemplo: Pereira':'Sin título';
 if(b.type==='heading')select(root,'Nivel',String(b.level),[['2','Título'],['3','Subtítulo']],v=>b.level=Number(v));
 if (!isSophiaDocument(doc)) select(root,'Disposición',b.layout,[['reading','Ancho de lectura'],['wide','Ancho completo'],['two-columns','Dos columnas'],['three-columns','Tres columnas']],v=>b.layout=v);
 const placement=element('fieldset'),legend=element('legend','Posición y tamaño');
 placement.append(legend);if(!isSophiaDocument(doc))root.append(placement);
 function slider(key,label,initial,min,max,unit){
  const wrapper=element('label'),caption=element('span'),control=element('input');
  control.type='range';control.min=min;control.max=max;control.value=b[key]??initial;
  function updateLabel(){caption.textContent=label+' · '+control.value+unit}
  updateLabel();control.oninput=()=>{b[key]=Number(control.value);updateLabel();changed()};
  wrapper.append(caption,control);placement.append(wrapper);return control;
 }
 slider('widthPercent','Ancho del bloque',100,10,100,'%');
 const horizontal=slider('positionPercent','Posición horizontal',0,0,100,'%');
 for(const [name,value] of [['Izquierda',0],['Centrar',50],['Derecha',100]]){
  action(placement,name,()=>{
   b.textAlign=['left','center','right'][value/50];
   placement.querySelector('select').value=b.textAlign;
   horizontal.value=value;horizontal.dispatchEvent(new Event('input'));
  });
 }
 slider('spaceAbove','Espacio arriba',0,0,160,' px');
 select(placement,'Alineación del texto',b.textAlign??'auto',[['auto','Original'],['left','Izquierda'],['center','Centrado'],['right','Derecha']],v=>{if(v==='auto')delete b.textAlign;else b.textAlign=v});
 if(b.type==='hero'){
  input(root,'Antetítulo',b.eyebrow,v=>b.eyebrow=v);
  for(const [index,key] of ['cover','secondCover'].entries()){
   const group=element('fieldset');group.append(element('legend','Imagen de portada '+(index+1)));root.append(group);
   coverSlot(group,b,key,false);
  }
 }
 if(['hero','section','timeline'].includes(b.type))input(root,'Introducción',b.description,v=>b.description=v,{large:true});
 if(b.type==='text')richEditor=mountRichEditor(root,b,changed);
 if(b.type==='section' && !isSophiaDocument(doc))root.append(element('p','Selecciona “Añadir dentro de la sección” para crear bloques o subsecciones.'));
 if (b.type==='plates' && isSophiaDocument(doc)) {
  for (const label of plateLabels) {
   const group=element('fieldset');
   group.append(element('legend',label));
   root.append(group);
   const slot={type:'hero',cover:b.items.find(item=>item.label===label)};
   const update=()=>{
    b.items=b.items.filter(item=>item.label!==label);
    if(slot.cover) b.items.push({...slot.cover,label});
    b.items.sort((a,c)=>plateLabels.indexOf(a.label)-plateLabels.indexOf(c.label));
    changed();
   };
   mountMedia(group,slot,{input,action,changed:update,refresh:fields,message,busy,locked:true,plateLabel:label});
  }
 } else if(['plates','comparison'].includes(b.type))mountMedia(root,b,{input,action,changed,refresh:fields,message,busy});
 if(b.type==='timeline'){
  input(root,'Periodo mostrado',b.range,v=>b.range=v);
  b.events.forEach((event,index)=>{const details=element('details'),summary=element('summary',`${event.date||'Sin fecha'} · ${event.title||'Nuevo evento'}`);details.append(summary);input(details,'Fecha o intervalo',event.date,v=>{event.date=v;summary.textContent=`${event.date||'Sin fecha'} · ${event.title||'Nuevo evento'}`});input(details,'Etapa',event.era,v=>event.era=v);input(details,'Título del evento',event.title,v=>{event.title=v;summary.textContent=`${event.date||'Sin fecha'} · ${event.title||'Nuevo evento'}`});input(details,'Descripción',event.body,v=>event.body=v,{large:true});eventCategories(details,event);action(details,'Eliminar evento',()=>{b.events.splice(index,1);changed();fields()});if(index>0)action(details,'Subir evento',()=>{[b.events[index-1],b.events[index]]=[b.events[index],b.events[index-1]];changed();fields()});root.append(details)});
  action(root,'Añadir evento',()=>{b.events.push({date:'',era:'',title:'',body:'',tags:[],source:{name:'',url:''}});changed();fields()});
 }
 if(b.type==='sources'){
  b.items.forEach((item,index)=>{input(root,'Referencia',item.name,v=>item.name=v);input(root,'URL',item.url,v=>item.url=v);action(root,'Quitar fuente',()=>{b.items.splice(index,1);changed();fields()})});
  action(root,'Añadir fuente',()=>{b.items.push({name:'',url:''});changed();fields()});
 }
 if(isSophiaDocument(doc)) return;
 action(root,'Duplicar bloque',()=>{const result=duplicateBlock(doc,b.id);doc=result.document;selected=result.id;changed();selectBlock(selected)});
 action(root,'Eliminar bloque',async()=>{if(!await confirmChange('¿Eliminar este bloque y sus subsecciones del borrador?'))return;doc=removeBlock(doc,b.id);selected=doc.blocks[0]?.id;changed();fields()});
}
async function reference(){const response=await fetch('/dev/fixtures/santa-sofia.json');if(!response.ok)throw Error('No se pudo cargar la referencia');const next=await response.json();const errors=validateDocument(next);if(errors.length)throw Error(errors.join('\n'));return next}
$('#reference').addEventListener('click',async()=>{if(doc&&!await confirmChange('¿Reemplazar el borrador del taller por la referencia de Santa Sofía? Exporta antes si quieres conservarlo.'))return;try{replaceDocument(await reference());changed()}catch(e){message(e.message,true)}});
$('#recover').addEventListener('click',async()=>{try{const saved=loadDraft(localStorage);if(!saved){message('Todavía no hay un borrador guardado.');return}if(dirty&&!await confirmChange('¿Descartar los cambios pendientes y recuperar la copia guardada?'))return;revision=saved.revision;replaceDocument(saved.document);dirty=false;message('Borrador recuperado.')}catch(e){message(e.message,true)}});
$('#document-title').addEventListener('input',e=>{doc.title=e.target.value;changed()});
$('#save').addEventListener('click', () => {
 if (persist() && doc.location) previewDraftMap(14, $('#save'));
});
function add(child=false){const b=newBlock($('#block-type').value);if(child){const parent=findBlock(doc.blocks,selected);if(parent?.type!=='section')return;parent.children.push(b)}else doc.blocks.push(b);selected=b.id;changed();selectBlock(b.id)}
$('#add-root').addEventListener('click',()=>add());$('#add-child').addEventListener('click',()=>add(true));
$('#preview-toggle').addEventListener('click',()=>{const on=document.body.classList.toggle('preview-mode');$('#preview-toggle').setAttribute('aria-pressed',String(on));$('#preview-toggle').textContent=on?'← Volver al editor':'Previsualizar ↗'});
$('#export').addEventListener('click',()=>{const errors=validateDocument(doc);if(errors.length){message(errors.join('\n'),true);return}const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=element('a');a.href=url;a.download='exposicion.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('#import').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>MAX_BYTES)throw Error('El archivo supera el tamaño permitido');const next=JSON.parse(await file.text()),errors=validateDocument(next);if(errors.length)throw Error(errors.join('\n'));if(!await confirmChange('¿Reemplazar el borrador por el documento importado?'))return;replaceDocument(next);changed();const missing=await missingAssets(next);if(missing.length)message(`Faltan ${missing.length} imágenes locales. Importa el ZIP completo.`,true)}catch(error){message(error.message,true)}finally{e.target.value=''}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
window.addEventListener('storage',e=>{if(e.key==='jsop-block-draft-v1'){clearTimeout(timer);message('Otra pestaña guardó cambios. Recupera el borrador o exporta tu copia antes de continuar.',true)}});
try{const saved=loadDraft(localStorage);revision=saved?.revision??0;replaceDocument(saved?.document??newSophiaDocument());message(saved?'Borrador local recuperado.':'Plantilla de Santa Sofía lista.')}catch(e){message(e.message,true);replaceDocument(newSophiaDocument())}

const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('#export-backup').onclick=async()=>{busy(true);message('Preparando respaldo con imágenes…');try{download(await runTask('backup',doc),'exposicion-con-imagenes.zip');message('Copia ZIP creada con el documento y sus imágenes locales.')}catch(e){message(e.message,true)}finally{busy(false)}};
$('#import-backup').onchange=async event=>{const file=event.target.files[0];if(!file)return;busy(true);message('Comprobando respaldo e imágenes…');try{const backup=await runTask('readBackup',file);if(!await confirmChange('¿Restaurar el documento y las imágenes de esta copia ZIP?'))return;const next=await restoreBackup(backup);clearAssetURLs();replaceDocument(next);changed()}catch(e){message(e.message,true)}finally{busy(false);event.target.value=''}};
$('#location').onclick=mountLocation(document.body,()=>doc,changed,persist);

for(const [id,cls] of [['outline-toggle','outline-hidden'],['inspector-toggle','inspector-hidden']]){$('#'+id).onclick=()=>{const hidden=document.body.classList.toggle(cls);$('#'+id).setAttribute('aria-expanded',String(!hidden))}};
if(innerWidth<=960){document.body.classList.add('outline-hidden');$('#outline-toggle').setAttribute('aria-expanded','false')}
if(innerWidth<=650){document.body.classList.add('inspector-hidden');$('#inspector-toggle').setAttribute('aria-expanded','false')}
document.addEventListener('click',event=>{const menu=$('.file-menu');if(!menu.contains(event.target))menu.open=false});
$('.file-menu').addEventListener('keydown',event=>{if(event.key==='Escape'){$('.file-menu').open=false;$('.file-menu summary').focus()}});
for(const button of $('.file-menu').querySelectorAll('button'))button.addEventListener('click',()=>$('.file-menu').open=false);

$('#new-document').onclick=async()=>{if(!await confirmChange('¿Empezar una exposición con la plantilla de Santa Sofía? Exporta el borrador actual si quieres conservarlo.'))return;replaceDocument(newSophiaDocument());changed();message('Plantilla de Santa Sofía lista para completar.')};

await connectCloudEditor({getDocument:()=>doc,setDocument:next=>{replaceDocument(next);persist()},confirm:confirmChange,message,busy});
