export const ASSET_ID=/^[a-f0-9]{64}$/;
export const MAX_IMAGE=25*1024*1024;
export function fittedSize(width,height,max){const ratio=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))}}
export function assetReferences(doc){const ids=new Set();function walk(blocks){for(const b of blocks){if(b.cover?.assetId)ids.add(b.cover.assetId);if(b.secondCover?.assetId)ids.add(b.secondCover.assetId);for(const item of b.items||[])if(item.assetId)ids.add(item.assetId);if(b.children)walk(b.children)}}walk(doc.blocks);return [...ids]}
export async function hashBlob(blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function openAssets(){return new Promise((resolve,reject)=>{const request=indexedDB.open('jsop-media-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('assets',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
export async function getAsset(id){const db=await openAssets();try{return await new Promise((resolve,reject)=>{const r=db.transaction('assets').objectStore('assets').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
export async function putAssets(records){const db=await openAssets();try{await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('No se pudieron guardar las imágenes'));for(const record of records)tx.objectStore('assets').put(record)})}finally{db.close()}}
export async function optimizeImage(file,kind='photo'){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Usa imágenes JPG, PNG o WebP. Exporta PDF/SVG/HEIC a PNG antes de añadirlos.');
 if(file.size>MAX_IMAGE)throw Error('Cada imagen debe pesar menos de 25 MiB.');
 const bitmap=await createImageBitmap(file);try{
 if(bitmap.width*bitmap.height>80_000_000)throw Error('La imagen supera 80 megapíxeles. Reduce sus dimensiones.');
 async function resize(max,type,quality){const size=fittedSize(bitmap.width,bitmap.height,max),canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(size.width,size.height):document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;canvas.getContext('2d').drawImage(bitmap,0,0,size.width,size.height);const blob=canvas.convertToBlob?await canvas.convertToBlob({type,quality}):await new Promise(resolve=>canvas.toBlob(resolve,type,quality));if(!blob)throw Error('No se pudo optimizar la imagen');return {blob,...size}}
 const full=await resize(kind==='plan'?3200:2400,kind==='plan'?'image/png':'image/webp',.86);if(full.blob.size>MAX_IMAGE)throw Error('El plano optimizado supera 25 MiB');
 const thumb=await resize(800,'image/webp',.8);return {id:await hashBlob(full.blob),blob:full.blob,thumbnail:thumb.blob,width:full.width,height:full.height,name:file.name.slice(0,300),kind};
 }finally{bitmap.close()}
}
// One object URL per asset/variant, shared across rerenders. Revoked when the document changes.
const urls=new Map();
export async function resolveAsset(id,thumbnail=false){const key=id+(thumbnail?':thumb':':full');if(!urls.has(key))urls.set(key,(async()=>{const record=await getAsset(id);if(!record)throw Error('Falta una imagen local. Importa la copia ZIP con imágenes.');return URL.createObjectURL(thumbnail?record.thumbnail:record.blob)})());try{return await urls.get(key)}catch(e){urls.delete(key);throw e}}
export function clearAssetURLs(){for(const promise of urls.values())promise.then(url=>URL.revokeObjectURL(url)).catch(()=>{});urls.clear()}
export async function missingAssets(doc){const missing=[];for(const id of assetReferences(doc))if(!await getAsset(id))missing.push(id);return missing}
