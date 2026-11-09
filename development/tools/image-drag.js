// Keep pointer capture on the canvas while the figure moves into its own row.
export function enableImageDrag(canvas, {getBlock, commit, redraw}) {
 let drag = null;
 const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
 canvas.addEventListener('dragstart', event => {
  if (!document.body.classList.contains('preview-mode') && event.target.closest('figure')) event.preventDefault();
 });
 canvas.addEventListener('pointerdown', event => {
  if (drag || event.button !== 0 || !event.isPrimary || document.body.classList.contains('preview-mode')) return;
  const image = event.target.closest('.block-image-open img');
  if (!image) return;
  const figure = image.closest('figure');
  const node = figure.closest('[data-block-id]');
  const block = getBlock(node.dataset.blockId);
  const figures = [...node.querySelectorAll('figure')].filter(f => f.closest('[data-block-id]') === node);
  const item = block.type === 'hero' ? block.cover : block.items?.[figures.indexOf(figure)];
  if (!item) return;
  const rect = figure.getBoundingClientRect();
  drag = {id:event.pointerId, startX:event.clientX, startY:event.clientY, grab:(event.clientX-rect.left)/rect.width,
   figure, item, node, rect, moved:false};
 });
 canvas.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const d = drag;
  if (!d.moved) {
   if (Math.hypot(event.clientX-d.startX,event.clientY-d.startY)<5) return;
   canvas.setPointerCapture(event.pointerId);
   d.moved=true;
   const grid=d.figure.closest('.media-grid');
   grid?.classList.remove('positioned-gallery');
   d.row=d.figure.parentElement;
   if (!d.row.classList.contains('positioned-image-row')) {
    d.row=document.createElement('div');
    d.row.className='positioned-image-row';
    d.figure.before(d.row);
    d.row.append(d.figure);
   }
   const room=d.row.getBoundingClientRect().width;
   d.width=d.item.imageWidth??clamp(Math.round(d.rect.width/room*100),10,100);
   // A full-width image needs horizontal space before it can follow a sideways drag.
   if (d.width===100 && Math.abs(event.clientX-d.startX)>Math.abs(event.clientY-d.startY)) d.width=65;
   d.figure.style.width=d.width+'%';
   d.startGap=d.item.imageTop??0;
   canvas.classList.add('moving-image');
  }
  const row=d.row.getBoundingClientRect();
  const free=row.width*(1-d.width/100);
  d.position=clamp(Math.round(100*(event.clientX-row.left-d.grab*(row.width-free))/Math.max(1,free)),0,100);
  d.top=clamp(Math.round(d.startGap+event.clientY-d.startY),0,600);
  d.figure.style.marginInlineStart=((100-d.width)*d.position/100)+'%';
  d.row.style.paddingTop=d.top+'px';
 });
 function finish(event,cancelled) {
  if (!drag || drag.id !== event.pointerId) return;
  const d=drag;drag=null;
  if (!d.moved) return;
  canvas.classList.remove('moving-image');
  if (canvas.hasPointerCapture(d.id)) canvas.releasePointerCapture(d.id);
  if (cancelled) {redraw();return;}
  Object.assign(d.item,{imageWidth:d.width,imagePosition:d.position,imageTop:d.top});
  commit(d.node.dataset.blockId);
 }
 canvas.addEventListener('pointerup',event=>finish(event,false));
 canvas.addEventListener('pointercancel',event=>finish(event,true));
 canvas.addEventListener('lostpointercapture',event=>finish(event,true));
 window.addEventListener('pointerup',event=>finish(event,false));
 window.addEventListener('blur',()=>{if(drag)finish({pointerId:drag.id},true)});
}
