import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {JSDOM} from 'jsdom';
import {zipSync,strToU8} from 'fflate';
import {importChronicle, validChronicle, renderChronicle, PDF, DOCX} from '../development/tools/chronicle.js';
import {assetReferences,getAsset} from '../development/tools/assets.js';
import {createBackup,readBackup,restoreBackup} from '../development/tools/backup.js';
import {validateDocument} from '../development/blocks/model.js';
import {newSophiaDocument,checkSophiaSubmission} from '../development/blocks/sophia-template.js';
import {editAnalysis} from '../development/tools/analysis-editor.js';
import {mountAnalysis} from '../dist/sophia-analysis.js';
import {publishedChronicle} from '../development/cloud/analysis-contributions.js';
const pdf = () => new File(['%PDF-1.4\n%%EOF'], 'Crónica.pdf', {type:PDF});
const word = () => new File([zipSync({
 '[Content_Types].xml':strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
 '_rels/.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
 'word/document.xml':strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Mi crónica de prueba</w:t></w:r></w:p></w:body></w:document>')
})], 'Historia.docx', {type:DOCX});
async function until(fn) { for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}assert.fail('La operación no terminó'); }

test('PDF y Word persisten como archivos y sobreviven al respaldo ZIP', async()=>{
 const files=await Promise.all([importChronicle(pdf()),importChronicle(word())]);
 const doc=newSophiaDocument();doc.chronicle=files;doc.analysisTarget='bizantino';
 assert.deepEqual(validateDocument(doc),[]);assert.doesNotThrow(()=>checkSophiaSubmission(doc));
 assert.deepEqual(assetReferences(doc),files.map(f=>f.assetId));
 const backup=await readBackup(await createBackup(doc));
 assert.deepEqual((await restoreBackup(backup)).chronicle,files);
 assert.equal((await getAsset(files[1].assetId)).blob.type,DOCX);
 assert(!JSON.stringify(doc).includes('base64'));
});
test('rechaza archivos falsos, antiguos y referencias inválidas',async()=>{
 await assert.rejects(importChronicle(new File(['bad'],'falso.pdf')),/PDF válido/);
 await assert.rejects(importChronicle(new File(['bad'],'viejo.doc')),/doc antiguos/);
 await assert.rejects(importChronicle(new File([zipSync({'other.xml':strToU8('x')})],'falso.docx')),/docx válido/);
 assert.equal(validChronicle([{assetId:'javascript:alert(1)',mime:PDF,name:'x'}]),false);
});
test('soltar un documento lo agrega al editor y permite quitarlo',async()=>{
 const dom=new JSDOM('<main></main>');globalThis.document=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 try {
  const doc={};let changes=0;editAnalysis(doc,()=>changes++);
  const event=new dom.window.Event('drop',{cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{files:[pdf()]}});
  document.querySelector('.chronicle-drop').dispatchEvent(event);
  await until(()=>doc.chronicle?.length===1);
  assert.equal(changes,1);
  const remove=[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Quitar '));remove.click();assert.deepEqual(doc.chronicle,[]);
 }finally{delete globalThis.document;dom.window.close()}
});
test('crónicas aprobadas se asocian a su destino y revisión',()=>{
 const f={assetId:'a'.repeat(64),mime:PDF,name:'Prueba.pdf'};
 const rows=[{exhibition_id:'base',revision_id:'r1',document:{chronicle:[f]}},{revision_id:'r2',document:{analysisTarget:'base',chronicle:[f]}},{document:{analysisTarget:'otro',chronicle:[f]}}];
 assert.deepEqual(publishedChronicle('base',rows).map(f=>f.revisionId),['r1','r2']);
});
test('Cr abre la ventana, muestra PDF y convierte Word dentro de un iframe aislado',async()=>{
 const dom=new JSDOM('<main></main>');globalThis.document=dom.window.document;globalThis.window=dom.window;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 const docx=word();const url=URL.createObjectURL(docx);
 try{
  const root=document.querySelector('main');mountAnalysis(root);
  root.showChronicle=content=>renderChronicle([{name:'Crónica.pdf',mime:PDF},{name:'Historia.docx',mime:DOCX}],content,async file=>file.mime===PDF?'https://example.org/document.pdf':url);
  document.querySelector('[aria-label="Crónica"]').click();
  const buttons=[...document.querySelectorAll('.chronicle-document button')];buttons[0].click();await until(()=>document.querySelector('iframe'));
  assert.equal(document.querySelector('iframe').src,'https://example.org/document.pdf');
  buttons[1].click();await until(()=>document.querySelectorAll('iframe').length===2);
  const frame=document.querySelectorAll('iframe')[1];assert.equal(frame.getAttribute('sandbox'),'');assert.match(frame.srcdoc,/Mi crónica de prueba/);
 }finally{URL.revokeObjectURL(url);delete globalThis.document;delete globalThis.window;dom.window.close()}
});
