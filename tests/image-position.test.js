import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountMedia} from '../development/tools/media-editor.js';
import {renderDocument} from '../development/blocks/render.js';

test('centrar una lámina desplaza su figura sin mover el bloque ni la otra imagen',()=>{
 const dom=new JSDOM('<aside></aside><main></main>');
 globalThis.document=dom.window.document;
 const block={id:'laminas',type:'plates',title:'',layout:'three-columns',widthPercent:80,positionPercent:100,
  items:['Una','Otra'].map(alt=>({src:'/assets/prueba.png',alt}))};
 const doc={schemaVersion:1,title:'Prueba',blocks:[block]};
 const canvas=document.querySelector('main'),panel=document.querySelector('aside');
 const render=()=>renderDocument(JSON.parse(JSON.stringify(doc)),canvas);
 const action=(container,text,fn)=>{const btn=document.createElement('button');btn.textContent=text;btn.onclick=fn;container.append(btn);return btn};
 try{
  render();const blockStyle=canvas.firstChild.style.cssText;
  mountMedia(panel,block,{input(){},action,changed:render});
  const controls=panel.querySelector('.image-position-controls');
  const click=text=>[...controls.querySelectorAll('button')].find(btn=>btn.textContent===text).click();
  click('Centrar imagen');
  let figure=canvas.querySelector('.positioned-image-row figure');
  assert.equal(figure.style.marginInlineStart,'33.5%');
  assert.equal(figure.style.width,'33%');
  click('Derecha');
  figure=canvas.querySelector('.positioned-image-row figure');
  assert.equal(figure.style.marginInlineStart,'67%');
  assert.equal(canvas.firstChild.style.cssText,blockStyle);
  assert.equal(canvas.querySelectorAll('.media-grid > figure').length,1);
  click('Volver a la cuadrícula');
  assert.equal(canvas.querySelectorAll('.media-grid > figure').length,2);
 }finally{delete globalThis.document;dom.window.close()}
});
