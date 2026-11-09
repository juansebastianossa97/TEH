import {optimizeImage} from './assets.js';
export function runTask(task,payload){
 if(task==='optimize'&&(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'))return optimizeImage(payload.file,payload.kind);
 return new Promise((resolve,reject)=>{const worker=new Worker('/dev/build/tools/task-worker.js?v=validation1',{type:'module'});const finish=()=>{clearTimeout(timeout);worker.terminate()};const timeout=setTimeout(()=>{finish();reject(Error('La operación tardó demasiado. Prueba con menos imágenes.'))},120000);worker.onmessage=({data})=>{finish();data.ok?resolve(data.result):reject(Error(data.error))};worker.onerror=()=>{finish();reject(Error('No se pudo cargar el procesador de archivos. Ejecuta npm run build:editor y recarga.'))};worker.postMessage({task,payload})});
}
