import {sophiaTimeline,initSophiaTimeline} from './sophia-timeline.js?v=1';
document.querySelector('#detail-timeline').innerHTML=sophiaTimeline();
initSophiaTimeline();
const viewer=document.querySelector('#plan-viewer');
let opener;
document.querySelectorAll('.plan-open').forEach(button=>button.addEventListener('click',()=>{
 opener=button;
 const image=button.querySelector('img');
 document.querySelector('#viewer-image').src=image.src;
 document.querySelector('#viewer-image').alt=image.alt;
 document.querySelector('#plan-viewer-title').textContent=button.getAttribute('aria-label').replace('Ampliar mapa','Mapa');
 viewer.showModal();
 document.body.classList.add('plan-is-open');
}));
document.querySelector('#close-plan').addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',event=>{if(event.target===viewer){const rect=viewer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)viewer.close()}});
viewer.addEventListener('close',()=>{document.body.classList.remove('plan-is-open');opener?.focus()});
if(location.hash==='#historia-santa-sofia')requestAnimationFrame(()=>document.getElementById('historia-santa-sofia').scrollIntoView({behavior:'instant'}));
