import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {staticPublications,findStaticPublication,combinePublications} from '../development/cloud/static-publications.js';
import {validateDocument} from '../development/blocks/model.js';
import {renderDocument} from '../development/blocks/render.js';

test('las exposiciones curadas conservan orden, no duplican IDs y se abren sin consulta remota',()=>{
 const rows=combinePublications([{exhibition_id:'barcelona'},{exhibition_id:'karnak'}]);
 assert.deepEqual(rows.map(r=>r.exhibition_id),['barcelona','karnak','teyuna','mesopotamia-ur']);
 assert.deepEqual(rows.map((_,i)=>String(8+i).padStart(2,'0')),['08','09','10','11']);
 assert.equal(findStaticPublication('teyuna').author,'Tomás Esguerra');
 assert.equal(findStaticPublication('mesopotamia-ur').author,'Jean Carlos Fuentes Urbano, Salomé Echeverri García y Juan José Varón Llano');
 assert.equal(findStaticPublication('unknown'),undefined);
 assert.equal(combinePublications([]).length,3);
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
