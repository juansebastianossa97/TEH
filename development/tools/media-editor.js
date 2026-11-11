import {runTask} from './worker-client.js';
import {safeURL} from '../blocks/model.js';
import {putAssets,resolveAsset} from './assets.js';
function imagePositionControls(group,item,block,action,changed){
 const controls=document.createElement('div');
 controls.className='image-position-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Posición de esta imagen');
 const legend=document.createElement('strong');
 legend.textContent='Posición de esta imagen';
 controls.append(legend);
 const hint=document.createElement('p');
 hint.textContent='Arrastra la foto en el lienzo para moverla.';
 controls.append(hint);
 const defaultWidth=({'two-columns':50,'three-columns':33})[block.layout]??65;
 function slider(label,key,initial,min,max=100,unit='%'){
  const wrapper=document.createElement('label'),caption=document.createElement('span');
  const range=document.createElement('input');
  range.type='range';range.min=min;range.max=max;range.value=item[key]??initial;
  const describe=()=>{caption.textContent=label+' · '+range.value+unit};
  describe();range.oninput=()=>{
   item.imageWidth??=defaultWidth;
   item.imagePosition??=0;
   item[key]=Number(range.value);describe();changed();
  };
  wrapper.append(caption,range);controls.append(wrapper);return range;
 }
 const pos=slider('Mover dentro del bloque','imagePosition',0,0);
 const width=slider('Ancho de la imagen','imageWidth',defaultWidth,10);
 const top=slider('Espacio encima de la imagen','imageTop',0,0,600,' px');
 for(const [text,value] of [['Izquierda',0],['Centrar imagen',50],['Derecha',100]]){
  action(controls,text,()=>{pos.value=value;pos.oninput();});
 }
 action(controls,'Volver a la cuadrícula',()=>{
  delete item.imagePosition;delete item.imageWidth;delete item.imageTop;
  pos.value=0;width.value=defaultWidth;top.value=0;
  top.previousElementSibling.textContent='Espacio encima de la imagen · 0 px';
  for(const range of [pos,width])range.previousElementSibling.textContent=range.previousElementSibling.textContent.split(' · ')[0]+' · '+range.value+'%';
  changed();
 });
 group.append(controls);
}
export function mountMedia(root,block,{input,action,changed,refresh,message,busy,plateLabel,locked=false,canvas=false,coverLabel}){
 const hero=block.type==='hero',items=hero?(block.cover?[block.cover]:[]):block.items;
 const drop=document.createElement('div');drop.className='media-drop';const label=document.createElement('label');label.textContent=plateLabel?'Seleccionar o reemplazar plano':hero?'Seleccionar portada o soltar aquí':'Seleccionar imágenes o soltarlas aquí';const picker=document.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp';picker.multiple=!hero&&block.type!=='comparison';label.append(picker);
 const mode=document.createElement('select');mode.setAttribute('aria-label','Tipo de imagen');for(const [value,text] of [['photo','Fotografía · WebP hasta 2400 px'],['plan','Plano · PNG hasta 3200 px']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option)}if(plateLabel)mode.value="plan";drop.append(label,mode);root.append(drop);
 async function receive(files){if(!files.length)return;const count=hero?1:block.type==='comparison'?2:30;if(files.length>count||!hero&&block.type!=='comparison'&&items.length+files.length>count){message(`Se permiten hasta ${count} imágenes.`,true);return}busy(true);try{const records=[];for(const [index,file] of files.entries()){message(`Preparando imagen ${index+1} de ${files.length}…`);records.push(await runTask('optimize',{file,kind:mode.value}))}await putAssets(records);const additions=records.map(a=>({assetId:a.id,alt:a.name,title:'',caption:'',author:'',source:'',kind:a.kind}));if(hero)block.cover=additions[0];else if(block.type==='comparison'){additions.forEach((item,index)=>block.items[index]=item)}else block.items.push(...additions);changed();refresh();message('Imágenes optimizadas y guardadas en este navegador. Exporta ZIP para respaldarlas.')}catch(e){message(e.message,true)}finally{busy(false)}}
 picker.onchange=()=>receive([...picker.files]);drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag-over')};drop.ondragleave=()=>drop.classList.remove('drag-over');drop.ondrop=e=>{e.preventDefault();e.stopPropagation();drop.classList.remove('drag-over');receive([...e.dataTransfer.files])};
 if(canvas){mode.hidden=true; label.firstChild.textContent=(plateLabel||coverLabel||"Portada")+" · Suelta una imagen o selecciónala";return}
 items.forEach((item,index)=>{const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=plateLabel?'Datos de la lámina':hero?'Portada':`Imagen ${index+1}`;group.append(legend);const image=document.createElement('img');image.className='media-thumbnail';image.alt=item.alt||'Vista de imagen';if(item.assetId)resolveAsset(item.assetId,true).then(url=>{if(image.isConnected)image.src=url}).catch(()=>{image.alt='Imagen local ausente: importa el ZIP'});else image.src=item.src;group.append(image);
 if(!locked)imagePositionControls(group,item,block,action,changed);
 if(!item.assetId)input(group,'Imagen (URL HTTPS o /assets/…)',item.src,v=>item.src=v);else group.append(document.createTextNode('Archivo guardado en IndexedDB'));
 for(const [key,label] of [['label','Etiqueta'],['title','Título de la imagen'],['alt','Texto alternativo'],['caption','Pie de imagen'],['author','Autor'],['source','Fuente / crédito'],['sourceURL','Enlace de la fuente']])if(!plateLabel || key!=='label')input(group,label,item[key],v=>item[key]=v,{large:key==='caption'});
 if(!hero){group.draggable=true;group.ondragstart=e=>{if(e.target.closest('input,button,textarea,select')){e.preventDefault();return}e.stopPropagation();e.dataTransfer.setData('application/x-jsop-image',String(index))};group.ondragover=e=>{if([...e.dataTransfer.types].includes('application/x-jsop-image'))e.preventDefault()};group.ondrop=e=>{e.preventDefault();e.stopPropagation();const raw=e.dataTransfer.getData('application/x-jsop-image');if(raw==='')return;const from=Number(raw);if(!Number.isInteger(from)||!items[from])return;items.splice(index,0,items.splice(from,1)[0]);changed();refresh()};for(const [delta,label] of [[-1,'Subir imagen'],[1,'Bajar imagen']]){const button=action(group,label,()=>{items.splice(index+delta,0,items.splice(index,1)[0]);changed();refresh()});button.disabled=index+delta<0||index+delta>=items.length}}
 action(group,'Quitar imagen',()=>{if(hero)delete block.cover;else items.splice(index,1);changed();refresh()});root.append(group);
 });
 if((hero&&!block.cover)||!hero&&(block.type!=='comparison'||items.length<2)){
  const urlLabel=document.createElement('label');urlLabel.textContent='O añadir una imagen por URL';const urlInput=document.createElement('input');urlInput.type='url';urlInput.placeholder='https://…';urlLabel.append(urlInput);root.append(urlLabel);
  action(root,'Añadir esta imagen',()=>{if(!safeURL(urlInput.value)){message('Introduce una URL HTTPS válida o una ruta /assets/.',true);return}const item={src:urlInput.value,alt:'',caption:''};if(hero)block.cover=item;else items.push(item);changed();refresh()});
 }
}
