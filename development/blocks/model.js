import {validRich} from '../tools/rich-content.js';
import {validLocation} from '../tools/location-model.js';
export const SCHEMA_VERSION = 1;
export const TYPES = ['heading','hero','section','text','plates','timeline','comparison','sources'];
export const LAYOUTS = ['reading','wide','two-columns','three-columns'];
export const MAX_BYTES = 2_000_000;
export const clone = value => JSON.parse(JSON.stringify(value));
export const uid = () => globalThis.crypto.randomUUID();
export function safeURL(value) {
  if (typeof value !== 'string') return false;
  if (/^\/assets\/[a-zA-Z0-9_./-]+(?:\?v=\d+)?$/.test(value) && !value.includes('..')) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export function validateDocument(doc) {
  const errors=[]; const ids=new Set(); let total=0;
  const text=(v,label,max=12000)=>{if(typeof v!=='string'||v.length>max)errors.push(`${label}: texto no válido`)};
  const list=(v,label,max=100)=>{if(!Array.isArray(v)||v.length>max){errors.push(`${label}: lista no válida`);return []}return v};
  const asset=(a)=>{if(!a||typeof a!=='object'){errors.push('Imagen no válida');return}if(a.imageTop!==undefined&&(!Number.isInteger(a.imageTop)||a.imageTop<0||a.imageTop>600))errors.push('Distancia vertical de imagen no válida');for(const [key,min] of [['imagePosition',0],['imageWidth',10]])if(a[key]!==undefined&&(!Number.isInteger(a[key])||a[key]<min||a[key]>100))errors.push('Posición o ancho de imagen no válido');if(a.assetId!==undefined){if(!/^[a-f0-9]{64}$/.test(a.assetId)||a.src!==undefined)errors.push('Referencia de imagen no válida')}else if(!safeURL(a.src))errors.push('URL de imagen no permitida');for(const key of ['author','source'])text(a[key]??'',key,1000);if(a.sourceURL&&!safeURL(a.sourceURL))errors.push('Fuente de imagen no permitida');text(a.alt,'Texto alternativo',1000);text(a.caption??'','Pie de imagen',2000);text(a.title??'','Título de imagen',300);text(a.label??'','Etiqueta de imagen',100)};
  if(!doc||typeof doc!=='object')return ['Documento no válido'];
  if(JSON.stringify(doc).length>MAX_BYTES)errors.push('Documento demasiado grande');
  if(doc.schemaVersion!==SCHEMA_VERSION)errors.push('Versión de documento no compatible');
  text(doc.title,'Nombre',200);if(doc.location!==undefined&&!validLocation(doc.location))errors.push('Ubicación no válida');
  function visit(blocks,depth=0){
    if(depth>5){errors.push('Demasiados niveles de subsecciones');return}
    for(const b of list(blocks,'Bloques',200)){
      if(++total>500){errors.push('Máximo 500 bloques');return}
      if(!b||!TYPES.includes(b.type)){errors.push('Tipo de bloque desconocido');continue}
      if(typeof b.id!=='string'||!b.id||ids.has(b.id))errors.push('Identificador ausente o duplicado');ids.add(b.id);
      if(!LAYOUTS.includes(b.layout))errors.push('Disposición desconocida');
      for(const [key,min,max] of [['widthPercent',10,100],['positionPercent',0,100],['spaceAbove',0,160]]){
        if(b[key]!==undefined&&(!Number.isInteger(b[key])||b[key]<min||b[key]>max))errors.push('Posición o tamaño fuera de rango');
      }
      if(b.textAlign!==undefined&&!['left','center','right'].includes(b.textAlign))errors.push('Alineación no válida');
      text(b.title,'Título',500);
      if(b.type==='heading'&&![2,3].includes(b.level))errors.push('Nivel de título no válido');
      if(b.type==='hero'){text(b.eyebrow,'Antetítulo',200);text(b.description,'Descripción');if(b.cover)asset(b.cover)}
      if(b.type==='section'){text(b.description??'','Introducción');visit(b.children,depth+1)}
      if(b.type==='text'){if(b.content!==undefined){if(!validRich(b.content))errors.push('Texto enriquecido no válido')}else text(b.body,'Texto');}
      if(b.type==='plates'||b.type==='comparison'){const items=list(b.items,'Imágenes',30);if(b.type==='comparison'&&items.length>2)errors.push('Una comparación admite hasta dos imágenes');items.forEach(asset)}
      if(b.type==='timeline'){
        text(b.description,'Introducción');text(b.range,'Periodo',100);
        for(const e of list(b.events,'Eventos',200)){
          if(!e||typeof e!=='object'){errors.push('Evento no válido');continue}
          text(e.date,'Fecha',100);text(e.era,'Etapa',200);text(e.title,'Evento',500);text(e.body,'Descripción de evento');
          list(e.tags,'Categorías',12).forEach(t=>text(t,'Categoría',80));
          if(e.source?.url||e.source?.name){if(!safeURL(e.source?.url))errors.push('Fuente no permitida');text(e.source?.name,'Fuente',300)}
        }
      }
      if(b.type==='sources')for(const item of list(b.items,'Fuentes')){if(!item||typeof item!=='object'){errors.push('Referencia no válida');continue}text(item.name,'Referencia',1000);if((item.name||item.url)&&!safeURL(item.url))errors.push('Referencia no permitida')}
    }
  }
  visit(doc.blocks);return errors;
}
export function findBlock(blocks,id){for(const b of blocks){if(b.id===id)return b;const child=b.children&&findBlock(b.children,id);if(child)return child}return null}
export function locateBlock(blocks,id){for(let i=0;i<blocks.length;i++){if(blocks[i].id===id)return {list:blocks,index:i};if(blocks[i].children){const found=locateBlock(blocks[i].children,id);if(found)return found}}return null}
export function moveBlock(doc,id,delta){const copy=clone(doc),found=locateBlock(copy.blocks,id);if(!found)return copy;const to=found.index+delta;if(to<0||to>=found.list.length)return copy;const [b]=found.list.splice(found.index,1);found.list.splice(to,0,b);return copy}
export function duplicateBlock(doc,id){const copy=clone(doc),found=locateBlock(copy.blocks,id);if(!found)return {document:copy,id:null};const block=clone(found.list[found.index]);function identify(b){b.id=uid();b.children?.forEach(identify)}identify(block);found.list.splice(found.index+1,0,block);return {document:copy,id:block.id}}
export function removeBlock(doc,id){const copy=clone(doc),found=locateBlock(copy.blocks,id);if(found)found.list.splice(found.index,1);return copy}
export function newBlock(type){
 const base={id:uid(),type,layout:'reading',title:''};
 if(type==='heading')return {...base,level:2};
 if(type==='hero')return {...base,eyebrow:'',description:''};
 if(type==='section')return {...base,description:'',children:[]};
 if(type==='text')return {...base,body:''};
 if(type==='plates')return {...base,layout:'three-columns',items:[]};
 if(type==='comparison')return {...base,layout:'two-columns',items:[]};
 if(type==='timeline')return {...base,description:'',range:'',events:[]};
 if(type==='sources')return {...base,items:[]};
 throw Error('Tipo desconocido');
}
export function saveDraft(storage,doc,expectedRevision){
 const errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 const previous=storage.getItem('jsop-block-draft-v1');
 const record=previous?JSON.parse(previous):null;
 if((record?.revision??0)!==expectedRevision)throw Error('Hay cambios de otra pestaña. Recupera el borrador antes de guardar.');
 const next={revision:expectedRevision+1,savedAt:new Date().toISOString(),document:clone(doc)};
 storage.setItem('jsop-block-draft-v1',JSON.stringify(next));return next;
}
export function loadDraft(storage){const raw=storage.getItem('jsop-block-draft-v1');if(!raw)return null;const saved=JSON.parse(raw);if(!Number.isInteger(saved.revision)||validateDocument(saved.document).length)throw Error('El borrador guardado no es válido');return saved}
