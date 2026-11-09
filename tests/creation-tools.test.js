import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {plainToRich,validRich,renderRich} from '../development/tools/rich-content.js';
import {coordinates} from '../development/tools/location-model.js';
import {validateDocument} from '../development/blocks/model.js';
import {hashBlob,putAssets,getAsset,assetReferences,fittedSize,missingAssets} from '../development/tools/assets.js';
import {createBackup,readBackup,restoreBackup} from '../development/tools/backup.js';
import {zipSync,unzipSync,strToU8} from 'fflate';
const reference=JSON.parse(await readFile(new URL('../development/fixtures/santa-sofia.json',import.meta.url)));
test('rich text compatibility and executable links rejected',()=>{
 assert(validRich(plainToRich('Antes\n\nDespués')));
 const rich={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Título'}]},{type:'blockquote',content:[{type:'paragraph',content:[{type:'text',text:'Cita',marks:[{type:'bold'},{type:'italic'},{type:'link',attrs:{href:'https://example.org'}}]}]}]}]};
 assert(validRich(rich));const doc=structuredClone(reference);doc.blocks.push({id:'text',type:'text',title:'Texto',layout:'reading',content:rich});assert.deepEqual(validateDocument(doc),[]);
 rich.content[1].content[0].content[0].marks[2].attrs.href='javascript:alert(1)';assert(!validRich(rich));assert(validateDocument(doc).length);
 assert(!validRich({type:'doc',content:[{type:'image',attrs:{src:'https://example.org'}}]}));
});
test('safe renderer preserves semantic formatting without interpreting HTML',()=>{
 const dom=new JSDOM();globalThis.document=dom.window.document;
 const node=renderRich({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'<script>alert(1)</script>',marks:[{type:'bold'},{type:'link',attrs:{href:'https://example.org'}}]}]},{type:'orderedList',attrs:{start:2},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Lista'}]}]}]}]});
 assert.equal(node.querySelectorAll('script').length,0);assert.equal(node.querySelector('strong').textContent,'<script>alert(1)</script>');assert.equal(node.querySelector('a').rel,'noopener noreferrer');assert.equal(node.querySelector('ol').start,2);
});
test('coordinates validate bounds, empty values and preserve precision',()=>{
 assert.equal(coordinates('41.008612','28.9802','Santa Sofía').lat,41.008612);
 for(const args of [['',2],[91,2],[0,181],['NaN',0]])assert.throws(()=>coordinates(...args));
 const doc=structuredClone(reference);doc.location=coordinates(41,28,'Estambul');assert.deepEqual(validateDocument(doc),[]);doc.location.lat=Infinity;assert(validateDocument(doc).length);
});
test('image resizing does not upscale and keeps aspect ratio',()=>{
 assert.deepEqual(fittedSize(6000,4000,2400),{width:2400,height:1600});assert.deepEqual(fittedSize(200,100,800),{width:200,height:100});
});
test('IndexedDB stores blobs; ZIP restores referenced assets without base64 JSON',async()=>{
 const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}),id=await hashBlob(blob);
 const record={id,blob,thumbnail:blob,name:'plan.png',width:200,height:100,kind:'plan'};await putAssets([record]);assert.equal((await getAsset(id)).blob.size,8);
 const doc=structuredClone(reference);doc.blocks[1].children[0].items.push({assetId:id,alt:'Plano',author:'Autor',source:'Archivo',sourceURL:'https://example.org',caption:''});assert.deepEqual(validateDocument(doc),[]);assert.deepEqual(assetReferences(doc),[id]);assert.deepEqual(await missingAssets(doc),[]);
 const zip=await createBackup(doc);const backup=await readBackup(zip);assert.deepEqual(backup.doc,doc);assert.equal(backup.records[0].blob.size,8);assert.equal(JSON.stringify(doc).includes('base64'),false);assert.deepEqual(await restoreBackup(backup),doc);
 const files=unzipSync(new Uint8Array(await zip.arrayBuffer()));files[`media/${id}`]=strToU8('tampered');await assert.rejects(readBackup(new Blob([zipSync(files)])),/dañada/);
 delete files[`media/${id}`];await assert.rejects(readBackup(new Blob([zipSync(files)])),/Falta/);
});
test('missing images are detectable; invalid asset refs and data URLs rejected',async()=>{
 const doc=structuredClone(reference);doc.blocks[0].cover={assetId:'f'.repeat(64),alt:'Missing'};assert.equal((await missingAssets(doc)).length,1);await assert.rejects(createBackup(doc),/Falta/);
 doc.blocks[0].cover.src='data:image/png;base64,AAAA';assert(validateDocument(doc).length);
});
test('gallery drop reorders metadata and images together',async()=>{
 const {mountMedia}=await import('../development/tools/media-editor.js');
 const dom=new JSDOM();globalThis.document=dom.window.document;const root=document.createElement('div');document.body.append(root);
 const block={type:'plates',items:[{src:'/assets/a.jpg',alt:'A',author:'Autor A'},{src:'/assets/b.jpg',alt:'B',author:'Autor B'}]};let changed=0;
 mountMedia(root,block,{input:()=>{},action:(container,title,fn)=>{const button=document.createElement('button');button.onclick=fn;container.append(button);return button},changed:()=>changed++,refresh:()=>{},message:()=>{},busy:()=>{}});
 const event=new dom.window.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{getData:()=> '0'}});root.querySelectorAll('fieldset')[1].dispatchEvent(event);
 assert.deepEqual(block.items.map(i=>[i.alt,i.author]),[['B','Autor B'],['A','Autor A']]);assert.equal(changed,1);
});

test('renderer keeps empty nested blocks editable and omits blank sources',async()=>{
 const {renderDocument}=await import('../development/blocks/render.js');
 const {newBlock}=await import('../development/blocks/model.js');
 const dom=new JSDOM();globalThis.document=dom.window.document;
 const section=newBlock('section'),child=newBlock('heading'),sources=newBlock('sources');section.children.push(child);sources.items.push({name:'',url:''});
 const root=document.createElement('main');renderDocument({schemaVersion:1,title:'',blocks:[section,sources]},root);
 assert(root.querySelector(`[data-block-id="${child.id}"]`));assert.equal(root.querySelectorAll('a').length,0);assert.equal(root.querySelector('[data-block-id]').dataset.empty,'true');
});
test('timeline without a source never invents a bibliography link',async()=>{
 const {renderDocument}=await import('../development/blocks/render.js');const {newBlock}=await import('../development/blocks/model.js');
 const dom=new JSDOM();globalThis.document=dom.window.document;const timeline=newBlock('timeline');timeline.events.push({date:'ENSAYO',title:'Prueba',era:'',body:'Sin fuente histórica',tags:[],source:{name:'',url:''}});
 const root=document.createElement('main');renderDocument({schemaVersion:1,title:'',blocks:[timeline]},root);assert.equal(root.querySelectorAll('a').length,0);assert.equal(root.querySelectorAll('.timeline-event').length,1);
});
