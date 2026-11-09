import {createBackup,readBackup} from './backup.js';
import {optimizeImage} from './assets.js';
self.onmessage=async({data})=>{try{const result=data.task==='backup'?await createBackup(data.payload):data.task==='readBackup'?await readBackup(data.payload):await optimizeImage(data.payload.file,data.payload.kind);self.postMessage({ok:true,result})}catch(error){self.postMessage({ok:false,error:error.message})}};
