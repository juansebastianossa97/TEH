import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {assetReferences,getAsset,putAssets,hashBlob,ASSET_ID,MAX_IMAGE} from './assets.js';
import {validateDocument} from '../blocks/model.js';
const LIMIT=150*1024*1024;
export async function createBackup(doc){
 const errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 const files={'exposition.json':strToU8(JSON.stringify(doc))},manifest=[];let size=files['exposition.json'].length;
 for(const id of assetReferences(doc)){const asset=await getAsset(id);if(!asset)throw Error('Falta una imagen. No se puede crear una copia completa.');size+=asset.blob.size+asset.thumbnail.size;if(size>LIMIT)throw Error('La copia supera 150 MiB');files[`media/${id}`]=new Uint8Array(await asset.blob.arrayBuffer());files[`media/${id}.thumb`]=new Uint8Array(await asset.thumbnail.arrayBuffer());manifest.push({id,type:asset.blob.type,thumbnailType:asset.thumbnail.type,name:asset.name,width:asset.width,height:asset.height,kind:asset.kind,thumbnailHash:await hashBlob(asset.thumbnail)})}
 files['manifest.json']=strToU8(JSON.stringify({version:1,assets:manifest}));return new Blob([zipSync(files,{level:0})],{type:'application/zip'});
}
export async function readBackup(file){
 if(file.size>LIMIT+1024*1024)throw Error('La copia supera 150 MiB');let expanded=0,entries=0;
 const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>{expanded+=entry.originalSize;if(++entries>1002||expanded>LIMIT||entry.originalSize>MAX_IMAGE)throw Error('Copia demasiado grande');return true}});
 if(!files['exposition.json']||files['exposition.json'].length>2_000_000||!files['manifest.json']||files['manifest.json'].length>500_000)throw Error('Copia incompleta');
 const doc=JSON.parse(strFromU8(files['exposition.json'])),errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 const manifest=JSON.parse(strFromU8(files['manifest.json']));if(manifest.version!==1||!Array.isArray(manifest.assets)||manifest.assets.length>500)throw Error('Manifiesto no válido');
 const records=[],seen=new Set();for(const a of manifest.assets){if(!a||!ASSET_ID.test(a.id)||seen.has(a.id)||!['image/png','image/jpeg','image/webp'].includes(a.type)||!['image/png','image/jpeg','image/webp'].includes(a.thumbnailType)||!Number.isInteger(a.width)||a.width<1||a.width>3200||!Number.isInteger(a.height)||a.height<1||a.height>3200||typeof a.name!=='string'||a.name.length>300)throw Error('Imagen del respaldo no válida');seen.add(a.id);const data=files[`media/${a.id}`],thumb=files[`media/${a.id}.thumb`];if(!data||!thumb)throw Error('Falta un archivo del respaldo');const blob=new Blob([data],{type:a.type});if(await hashBlob(blob)!==a.id)throw Error('Una imagen está dañada');const thumbnail=new Blob([thumb],{type:a.thumbnailType});if(await hashBlob(thumbnail)!==a.thumbnailHash)throw Error('Una miniatura está dañada');records.push({...a,blob,thumbnail})}
 if(assetReferences(doc).some(id=>!seen.has(id)))throw Error('El respaldo no contiene todas las imágenes');return {doc,records};
}
export async function restoreBackup(backup){await putAssets(backup.records);return backup.doc}
