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
 assert.deepEqual(rows.map(r=>r.exhibition_id),['karnak','teyuna','mesopotamia-ur','san-juan-letran','qorikancha','atenas-partenon']);
 assert.deepEqual(rows.map((_,i)=>String(places.length+i+1).padStart(2,'0')),['02','03','04','05','06','07']);
 assert.equal(findStaticPublication('teyuna').author,'Alejandro Velez Escobar, Tomás Alejandro Rubio y Santiago Hernández');
 assert.equal(findStaticPublication('mesopotamia-ur').author,'Jean Carlos Fuentes Urbano, Salomé Echeverri García y Juan José Varón Llano');
 assert.equal(findStaticPublication('unknown'),undefined);
 assert.equal(combinePublications([]).length,6);
});
test('documentos válidos, portadas distintas, recursos presentes y cronologías filtrables',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.org'});globalThis.document=dom.window.document;
 for(const row of staticPublications){
  assert.deepEqual(validateDocument(row.document),[]);
  const hero=row.document.blocks[0];assert.notEqual(hero.cover.src,hero.secondCover.src);
  const root=document.querySelector('main');renderDocument(row.document,root);
  for(const img of root.querySelectorAll('img'))assert.ok(fs.existsSync(new URL('../dist'+img.getAttribute('src'),import.meta.url)));
  const timeline=row.document.blocks.find(b=>b.type==='timeline');assert.ok(timeline.events.length>=10);
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
