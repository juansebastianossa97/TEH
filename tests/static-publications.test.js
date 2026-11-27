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
 assert.equal(rows[0].document.title,'Pabellón de la Secesión');
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
 const remote={exhibition_id:id,author:'Juan José Giraldo Díaz',description:'',document:{title:'THE RED HOUSE',blocks:[]}};
 const [row]=combinePublications([remote]);
 assert.equal(row.document.title,'The Red House');
 assert.equal(row.document.blocks,remote.document.blocks);
 assert.equal(remote.document.title,'THE RED HOUSE');
 assert.equal(row.description,'');
 assert.equal(row.author,'Juan José Giraldo Díaz y Juan José Aristizábal');
 assert.equal(row.chronicleFiles.length,2);
 assert.deepEqual(Object.keys(row.analysisPanels),['C','F','S','U','T']);
 const numbers=Object.values(row.analysisPanels).flat().map(p=>Number(p.title.split('.')[0]));
 assert.equal(numbers.length,40);
 assert.deepEqual(Array.from({length:42},(_,i)=>i+1).filter(n=>!numbers.includes(n)),[35,36]);
 for(const file of [...Object.values(row.analysisPanels).flat(),...row.chronicleFiles])assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
 assert.equal(combinePublications([{exhibition_id:'ee7a78c2-62fc-4c24-8756-514ad5c72130',author:'Santiago Ramirez',description:'',document:{}}])[0].author,'Santiago Ramírez Ospina y Thomas García Chica');
});

test('los nombres de exposición comparten formato y las nuevas aprobadas van al final del recorrido', async ()=>{
 const {formatTitle}=await import('../development/blocks/title-format.js');
 assert.equal(formatTitle('HACIENDA CAÑASGORDAS'),'Hacienda Cañasgordas');
 assert.equal(formatTitle('THE RED HOUSE'),'The Red House');
 assert.equal(formatTitle('pabellón de la secesión'),'Pabellón de la Secesión');
 assert.equal(formatTitle('  teoría   E historia III '),'Teoría e Historia III');
 assert.equal(formatTitle('Mesopotamia · Zigurat de Ur'),'Mesopotamia · Zigurat de Ur');
 for(const row of staticPublications)assert.equal(formatTitle(row.document.title),row.document.title);
 const early={exhibition_id:'a',published_at:'2026-11-23T13:47:24+00:00',document:{title:'ANTES'}};
 const late={exhibition_id:'b',published_at:'2026-11-25T19:09:49.736369+00:00',document:{title:'HACIENDA CAÑASGORDAS'}};
 const later={exhibition_id:'c',published_at:'2026-12-01T10:00:00+00:00',document:{title:'otra casa'}};
 const rows=combinePublications([early,late,later]);
 assert.deepEqual(rows.map(r=>r.exhibition_id),['a',...staticPublications.map(r=>r.exhibition_id),'b','c']);
 assert.deepEqual([rows[0].document.title,rows.at(-2).document.title,rows.at(-1).document.title],['Antes','Hacienda Cañasgordas','Otra Casa']);
 assert.equal(late.document.title,'HACIENDA CAÑASGORDAS');
});

test('Karnak: 36 puntos con texto y láminas urbanas 9–11 dentro de su punto', ()=>{
 const row=findStaticPublication('karnak');
 assert.deepEqual(validateDocument(row.document),[]);
 const keys=Object.keys(row.document.analysis).map(Number);
 assert.equal(keys.length,36);
 assert.ok(keys.every(n=>n>=1&&n<=42));
 assert.deepEqual(row.analysisPanels.F.map(p=>p.point),[9,10,11]);
 for(const file of Object.values(row.analysisPanels).flat())assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
});

test('las láminas con punto se dibujan dentro de su punto y las demás arriba, como antes', ()=>{
 const dom=new JSDOM('<div id="tiles"></div>',{url:'https://example.org'});globalThis.document=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 try {
  const tiles=document.querySelector('#tiles');
  mountAnalysis(tiles,{7:'Texto del punto siete.',8:'Texto del punto ocho.'});
  tiles.analysisPanels={F:[{src:'/a.png',alt:'Arriba',title:'Lámina general'},{point:9,src:'/nolli.png',alt:'Nolli'}]};
  tiles.querySelectorAll('button')[1].click();
  const scroll=document.querySelector('.analysis-scroll');
  const order=[...scroll.querySelectorAll('h3,h4,p,img')].map(n=>n.tagName==='IMG'?'img:'+n.alt:n.tagName.toLowerCase()+':'+n.textContent);
  assert.deepEqual(order,['h4:Lámina general','img:Arriba','h3:Forma urbana','h4:7. Paramentación','p:Texto del punto siete.','h4:8. Tipología','p:Texto del punto ocho.','h4:9. Plano de Nolli','img:Nolli']);
 }finally{delete globalThis.document;dom.window.close()}
});

test('Santa Sofía: imágenes con crédito dentro de los puntos que más las necesitan', async ()=>{
 const {sophiaPanels}=await import('../dist/sophia-analysis.js');
 const panels=Object.values(sophiaPanels).flat();
 assert.deepEqual(panels.map(p=>p.point).sort((a,b)=>a-b),[14,17,20,21,22,24,29,31,37,40,41]);
 for(const panel of panels){
  assert.ok(fs.existsSync(new URL('../dist'+panel.src,import.meta.url)));
  assert.ok(panel.credit.includes('Wikimedia Commons'));
  assert.match(panel.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
 }
 const dom=new JSDOM('<div id="tiles"></div>',{url:'https://example.org'});globalThis.document=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 try {
  const tiles=document.querySelector('#tiles');
  mountAnalysis(tiles,{},true);
  tiles.querySelectorAll('button')[1].click();
  const nodes=[...document.querySelectorAll('.analysis-scroll h4, .analysis-scroll img')];
  const heading=nodes.findIndex(n=>n.textContent==='17. Tipo edificatorio');
  const fletcher=nodes.findIndex(n=>n.tagName==='IMG'&&n.getAttribute('src')==='/assets/santa-sofia/p17-planta-secciones.webp');
  assert.ok(heading>=0&&fletcher>heading);
  assert.ok(nodes.slice(heading+1,fletcher).every(n=>n.tagName==='IMG'));
  const caption=document.querySelector('img[src="/assets/santa-sofia/p17-planta-secciones.webp"]').closest('figure').querySelector('figcaption a');
  assert.match(caption.textContent,/Banister Fletcher/);
  assert.equal(caption.getAttribute('href'),'https://commons.wikimedia.org/wiki/File:Santa_Sophia_282.jpg');
  // Other exhibitions without sophia keep no Santa Sofía images.
  document.querySelectorAll('dialog').forEach(d=>d.remove());
  mountAnalysis(tiles,{17:'Texto'});tiles.querySelectorAll('button')[1].click();
  assert.equal(document.querySelectorAll('img[src^="/assets/santa-sofia/"]').length,0);
 }finally{delete globalThis.document;dom.window.close()}
});

test('San Juan de Letrán: puntos del análisis contextual y láminas del PDF del grupo', ()=>{
 const row=findStaticPublication('san-juan-letran');
 assert.deepEqual(Object.keys(row.document.analysis).map(Number),[1,2,3,4,5,6,7,8,9,12,13,14,15,16]);
 assert.deepEqual(validateDocument(row.document),[]);
 assert.deepEqual(Object.keys(row.analysisPanels),['C','F']);
 for(const file of Object.values(row.analysisPanels).flat())assert.ok(fs.existsSync(new URL('../dist'+file.src,import.meta.url)));
});
