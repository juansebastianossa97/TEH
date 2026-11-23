import {places} from '../dist/original-places.js';
import {mountAnalysis} from '../dist/sophia-analysis.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {staticPublications,findStaticPublication,combinePublications} from '../development/cloud/static-publications.js';
import {validateDocument} from '../development/blocks/model.js';
import {renderDocument} from '../development/blocks/render.js';

test('las exposiciones curadas conservan orden, no duplican IDs y se abren sin consulta remota',()=>{
 const rows=combinePublications([{exhibition_id:'karnak'}]);
 assert.deepEqual(rows.map(r=>r.exhibition_id),['karnak','teyuna','mesopotamia-ur','san-juan-letran','qorikancha','atenas-partenon','casa-batllo']);
 assert.deepEqual(rows.map((_,i)=>String(places.length+i+1).padStart(2,'0')),['02','03','04','05','06','07','08']);
 assert.equal(findStaticPublication('teyuna').author,'Alejandro Velez Escobar, Tomás Alejandro Rubio y Santiago Hernández');
 assert.equal(findStaticPublication('mesopotamia-ur').author,'Jean Carlos Fuentes Urbano, Salomé Echeverri García y Juan José Varón Llano');
 assert.equal(findStaticPublication('unknown'),undefined);
 assert.equal(combinePublications([]).length,7);
});
test('documentos válidos, portadas distintas, recursos presentes y cronologías filtrables',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.org'});globalThis.document=dom.window.document;
 for(const row of staticPublications){
  assert.deepEqual(validateDocument(row.document),[]);
  const hero=row.document.blocks[0];assert.notEqual(hero.cover.src,hero.secondCover.src);
  const root=document.querySelector('main');renderDocument(row.document,root);
  for(const img of root.querySelectorAll('img'))assert.ok(fs.existsSync(new URL('../dist'+img.getAttribute('src'),import.meta.url)));
  const timeline=row.document.blocks.find(b=>b.type==='timeline');if (!timeline) { assert.equal(row.exhibition_id,'casa-batllo'); continue; } assert.ok(timeline.events.length>=10);
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
