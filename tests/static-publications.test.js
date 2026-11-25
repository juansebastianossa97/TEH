import {places} from '../dist/original-places.js';
import {mountAnalysis} from '../dist/sophia-analysis.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {staticPublications,findStaticPublication,combinePublications,withSupplement} from '../development/cloud/static-publications.js';
import {validateDocument} from '../development/blocks/model.js';
import {renderDocument} from '../development/blocks/render.js';

test('las exposiciones curadas conservan orden, no duplican IDs y se abren sin consulta remota',()=>{
 const rows=combinePublications([{exhibition_id:'karnak'}]);
 assert.deepEqual(rows.map(r=>r.exhibition_id),['karnak','teyuna','mesopotamia-ur','san-juan-letran','qorikancha','atenas-partenon','casa-batllo','capitolio-nacional']);
 assert.deepEqual(rows.map((_,i)=>String(places.length+i+1).padStart(2,'0')),['02','03','04','05','06','07','08','09']);
 assert.equal(findStaticPublication('teyuna').author,'Alejandro Velez Escobar, Tomás Alejandro Rubio y Santiago Hernández');
 assert.equal(findStaticPublication('mesopotamia-ur').author,'Jean Carlos Fuentes Urbano, Salomé Echeverri García y Juan José Varón Llano');
 assert.equal(findStaticPublication('unknown'),undefined);
 assert.equal(combinePublications([]).length,8);
});
test('documentos válidos, portadas distintas, recursos presentes y cronologías filtrables',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.org'});globalThis.document=dom.window.document;
 for(const row of staticPublications){
  assert.deepEqual(validateDocument(row.document),[]);
  const hero=row.document.blocks[0];assert.notEqual(hero.cover.src,hero.secondCover.src);
  const root=document.querySelector('main');renderDocument(row.document,root);
  for(const img of root.querySelectorAll('img'))assert.ok(fs.existsSync(new URL('../dist'+img.getAttribute('src'),import.meta.url)));
  const timeline=row.document.blocks.find(b=>b.type==='timeline');if (!timeline) { assert.ok(['casa-batllo','capitolio-nacional'].includes(row.exhibition_id)); continue; } assert.ok(timeline.events.length>=10);
  assert.equal(root.querySelectorAll('.timeline-event').length,timeline.events.length);
  const filter=[...root.querySelectorAll('.timeline-filters button')].find(b=>b.textContent==='Arquitectura');filter.click();
  assert.equal(root.querySelectorAll('.timeline-event:not([hidden])').length,timeline.events.filter(e=>e.tags.includes('Arquitectura')).length);
 }
 delete globalThis.document;
});

test('el recorrido inicial contiene solo Santa Sofía y su último enlace funciona',()=>{
 assert.deepEqual(places.map(p=>p.id),['bizantino']);
 const dom=new JSDOM('<div id="destination-nav"></div><div id="markers"></div><div id="chapters"></div>',{url:'https://example.org'});
 globalThis.document=dom.window.document;
 try {
  const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').split('for(let lon=')[0].replace(/^import .*;$/gm,'');
  new Function('places','mountAnalysis','document','location',source)(places,mountAnalysis,document,dom.window.location);
  assert.equal(document.querySelectorAll('.chapter').length,1);
  assert.equal(document.querySelector('.chapter').id,'bizantino');
  assert.equal(document.querySelector('.chapter-next a:last-child').getAttribute('href'),'#mapa');
 }finally{delete globalThis.document;dom.window.close()}
});

test('Casa Batlló: cinco categorías ilustradas y dos crónicas independientes sin cronología', async()=>{
 const {attachCuratedMedia}=await import('../development/cloud/curated-media.js');
 const row=findStaticPublication('casa-batllo');
 assert.equal(row.author,'Ana Sofía Gálvez García y Lina Marcela Bueno');
 assert.deepEqual(Object.keys(row.analysisPanels),['C','F','S','U','T']);
 assert.equal(row.chronicleFiles.length,2);
 assert.equal(row.document.blocks.some(b=>b.type==='timeline'),false);
 for(const file of [...Object.values(row.analysisPanels).flat(),...row.chronicleFiles])assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
 const dom=new JSDOM('<div id="tiles"></div>',{url:'https://example.org'});globalThis.document=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'))};
 try {
  const tiles=document.querySelector('#tiles');mountAnalysis(tiles,{});attachCuratedMedia(tiles,row);
  for(const [index,key] of ['C','F','S','U','T'].entries()){
   tiles.querySelectorAll('button')[index].click();
   assert.equal(document.querySelectorAll('dialog img').length,row.analysisPanels[key].length);
   assert.ok(!document.querySelector('dialog').textContent.includes('Aún no hay aportes'));
   document.querySelector('dialog header button').click();
  }
  tiles.querySelectorAll('button')[5].click();
  const buttons=document.querySelectorAll('dialog section button');assert.equal(buttons.length,2);
  buttons[0].click();buttons[1].click();
  const frames=[...document.querySelectorAll('iframe')];assert.equal(frames.length,2);assert.notEqual(frames[0].src,frames[1].src);
 }finally{delete globalThis.document;dom.window.close()}
});

test('Capitolio Nacional: 42 puntos válidos, láminas por categoría y dos crónicas', ()=>{
 const row=findStaticPublication('capitolio-nacional');
 assert.equal(row.author,'Mariana Bustamante Duque y Tamara Montesdeoca Anaya');
 assert.deepEqual(Object.keys(row.analysisPanels),['C','F','S','U','T']);
 assert.equal(row.chronicleFiles.length,2);
 assert.equal(Object.values(row.analysisPanels).flat().filter(p=>/^\d+\. /.test(p.title)).length,42);
 assert.deepEqual(validateDocument(row.document),[]);
 for(const key of Object.keys(row.document.analysis))assert.ok(Number(key)>=1&&Number(key)<=42);
 for(const file of [...Object.values(row.analysisPanels).flat(),...row.chronicleFiles])assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
});

test('Pabellón de la Secesión: la exposición de Supabase conserva su documento y suma láminas de los 42 puntos y dos crónicas', ()=>{
 const id='ee7a78c2-62fc-4c24-8756-514ad5c72130';
 const remote={exhibition_id:id,description:'',document:{title:'Pabellón de la secesión'}};
 const rows=combinePublications([remote]);
 assert.equal(rows[0].exhibition_id,id);
 assert.equal(rows[0].document,remote.document);
 assert.match(rows[0].description,/Joseph Maria Olbrich/);
 assert.equal(withSupplement({...remote,description:'Texto propio'}).description,'Texto propio');
 assert.deepEqual(Object.keys(rows[0].analysisPanels),['C','F','S','U','T']);
 const numbers=Object.values(rows[0].analysisPanels).flat().flatMap(p=>[...p.title.matchAll(/(\d+)\. /g)].map(m=>Number(m[1])));
 assert.deepEqual([...new Set(numbers)].sort((a,b)=>a-b),Array.from({length:42},(_,i)=>i+1));
 assert.equal(rows[0].chronicleFiles.length,2);
 for(const file of [...Object.values(rows[0].analysisPanels).flat(),...rows[0].chronicleFiles])assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
 assert.equal(withSupplement({exhibition_id:'otra'}).analysisPanels,undefined);
});

test('The Red House: la exposición de Supabase suma láminas y autores sin perder su texto', ()=>{
 const id='5bab803f-bed9-4204-ac80-56f62ef28d99';
 const remote={exhibition_id:id,author:'Juan José Giraldo Díaz',description:'',document:{title:'THE RED HOUSE'}};
 const [row]=combinePublications([remote]);
 assert.equal(row.document,remote.document);
 assert.equal(row.description,'');
 assert.equal(row.author,'Juan José Giraldo Díaz y Juan José Aristizábal');
 assert.deepEqual(row.chronicleFiles,[]);
 assert.deepEqual(Object.keys(row.analysisPanels),['C','F','S','U','T']);
 const numbers=Object.values(row.analysisPanels).flat().map(p=>Number(p.title.split('.')[0]));
 assert.equal(numbers.length,40);
 assert.deepEqual(Array.from({length:42},(_,i)=>i+1).filter(n=>!numbers.includes(n)),[35,36]);
 for(const file of Object.values(row.analysisPanels).flat())assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
 assert.equal(combinePublications([{exhibition_id:'ee7a78c2-62fc-4c24-8756-514ad5c72130',author:'Santiago Ramirez',description:'',document:{}}])[0].author,'Santiago Ramírez Ospina y Thomas García Chica');
});
