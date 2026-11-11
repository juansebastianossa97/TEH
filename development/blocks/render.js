import {renderRich} from '../tools/rich-content.js';
import {resolveAsset} from '../tools/assets.js';
import {validateDocument} from './model.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const link=(name,url)=>{const a=el('a','',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
export function renderDocument(doc,root){
 const errors=validateDocument(doc);if(errors.length)throw Error(errors.join('\n'));
 root.replaceChildren();root.className='exhibition-renderer';
 function draw(b,depth=0){
  const node=el('section',`block block-${b.type} layout-${b.layout}`);node.id=`block-${b.id}`;node.dataset.blockId=b.id;
  const width=b.widthPercent??100,position=(b.positionPercent??0)/100;
  if(b.widthPercent!==undefined||b.positionPercent!==undefined){
   node.style.width=width+'%';
   node.style.maxWidth='none';
   node.style.marginInlineStart=(100-width)*position+'%';
  }
  if(b.spaceAbove!==undefined)node.style.marginBlockStart=b.spaceAbove+'px';
  if(b.textAlign)node.style.textAlign=b.textAlign;
  const heading=()=>b.title.trim()&&node.append(el(depth===0?'h2':'h3','block-title',b.title));
  if(b.type==='heading'&&b.title.trim())node.append(el(`h${b.level}`,'block-title',b.title));
  if(b.type==='hero'){
   if(b.eyebrow.trim())node.append(el('p','eyebrow',b.eyebrow));if(b.title.trim())node.append(el('h1','',b.title));if(b.description.trim())node.append(el('p','hero-description',b.description));
   const covers=el('div','cover-pair');
   for(const key of ['cover','secondCover']){
    if(!b[key])continue;
    const tile=figure(b[key]);tile.dataset.coverKey=key;covers.append(tile);
   }
   if(covers.childElementCount)node.append(covers);
   const nav=el('nav','block-toc');for(const section of doc.blocks.filter(x=>(x.type==='section'||x.type==='timeline')&&x.title.trim())){const a=el('a','',section.title+' ↓');a.href='#block-'+section.id;nav.append(a)}if(nav.childElementCount&&(b.title.trim()||b.eyebrow.trim()||b.description.trim()||b.cover))node.append(nav);
  }
  if(b.type==='section'){heading();if(b.description)node.append(el('p','section-description',b.description));b.children.forEach(child=>node.append(draw(child,depth+1)))}
  if(b.type==='text'){if(b.title)heading();if(b.content){const content=renderRich(b.content);content.className='rich-content';node.append(content)}else for(const paragraph of b.body.split(/\n\s*\n/).filter(p=>p.trim()))node.append(el('p','prose',paragraph))}
  if(b.type==='plates'||b.type==='comparison'){if(b.title)heading();const grid=el('div','media-grid');const columns={'two-columns':2,'three-columns':3}[b.layout]??1;
   const used=Math.min(columns,b.items.length);
   if(b.positionPercent!==undefined&&used>0&&used<columns&&!b.items.some(item=>item.imagePosition!==undefined||item.imageWidth!==undefined)){
    const spare=(columns-used)/columns;
    grid.classList.add('positioned-gallery');
    grid.style.setProperty('--used-columns',String(used));
    grid.style.setProperty('--gallery-width',`calc(${100*(1-spare)}% - var(--gallery-gap) * ${spare})`);
    grid.style.setProperty('--gallery-start',`calc(${100*spare*position}% + var(--gallery-gap) * ${spare*position})`);
   }
   b.items.forEach(item=>grid.append(figure(item)));if(grid.childElementCount)node.append(grid)}
  if(b.type==='timeline'&&b.events.length){
   node.classList.add('sophia-timeline');const intro=el('header','timeline-intro'),left=el('div'),right=el('div');
   left.append(el('p','eyebrow','HISTORIA / LÍNEA DE TIEMPO'),el('h3','',b.title));right.append(el('span','timeline-range',b.range),el('p','',b.description));intro.append(left,right);node.append(intro);
   const filters=el('div','timeline-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filtrar acontecimientos por tema');
   const count=el('p','timeline-count');count.setAttribute('role','status');
   const list=el('ol','timeline-events');
   b.events.forEach((event,i)=>{const row=el('li','timeline-event'),date=el('div','timeline-date'),card=el('article','timeline-card'),top=el('div','timeline-card-top'),tags=el('div','timeline-tags');
    date.append(el('span','',event.date),el('small','',event.era));event.tags.forEach(t=>tags.append(el('span','',t)));
    top.append(el('span','timeline-index',String(i+1).padStart(2,'0')),tags);card.append(top,el('h4','',event.title),el('p','',event.body),...(event.source?.url?[link(event.source.name+' ↗',event.source.url)]:[]));row.append(date,card);list.append(row);
   });
   ['Todos',...new Set(b.events.flatMap(e=>e.tags).filter(t=>t!=='Todos'))].forEach(category=>{const button=el('button','',category);button.type='button';button.setAttribute('aria-pressed',String(category==='Todos'));button.addEventListener('click',()=>{
    for(const btn of filters.children)btn.setAttribute('aria-pressed',String(btn===button));let visible=0;
    [...list.children].forEach((row,i)=>{row.hidden=category!=='Todos'&&!b.events[i].tags.includes(category);if(!row.hidden)visible++});count.textContent=`${visible} ${visible===1?'acontecimiento':'acontecimientos'} · ${category}`;
   });filters.append(button)});
   count.textContent=`${b.events.length} acontecimientos · Todos`;node.append(filters,count,list);
  }
  if(b.type==='timeline'&&!b.events.length){heading();if(b.description.trim())node.append(el('p','section-description',b.description));}
  if(b.type==='sources'){heading();const ul=el('ul');b.items.filter(source=>source.name&&source.url).forEach(source=>{const li=el('li');li.append(link(source.name,source.url));ul.append(li)});if(ul.childElementCount)node.append(ul)}
  const visibleText=node.textContent.trim();if(!visibleText&&!node.querySelector('img')){node.dataset.empty='true';if(b.type!=='section')node.replaceChildren()}
  return node;
 }
 function figure(item){const fig=el('figure'),button=el('button','block-image-open'),image=el('img');button.type='button';button.setAttribute('aria-label',`Ampliar ${item.alt}`);if(item.assetId)resolveAsset(item.assetId,true).then(url=>{if(image.isConnected)image.src=url}).catch(()=>{image.alt='Imagen local ausente: importa la copia ZIP'});else image.src=item.src;image.alt=item.alt;image.loading='lazy';image.decoding='async';button.append(image,el('span','','Ampliar ↗'));button.addEventListener('click',()=>openImage(item,button));const caption=el('figcaption');if(item.label)caption.append(el('span','eyebrow',item.label));if(item.title)caption.append(el('h3','',item.title));caption.append(el('p','',item.caption));if(item.author||item.source){const credit=el('p','image-credit',[item.author,item.source].filter(Boolean).join(' · '));if(item.sourceURL)credit.append(' ',link('Fuente ↗',item.sourceURL));caption.append(credit)}else if(item.sourceURL)caption.append(link('Fuente ↗',item.sourceURL));fig.append(button,caption);
  if(item.imagePosition!==undefined||item.imageWidth!==undefined){
   const row=el('div','positioned-image-row');
   const width=item.imageWidth??65, offset=(100-width)*(item.imagePosition??0)/100;
   fig.style.width=width+'%';fig.style.marginInlineStart=offset+'%';
   row.style.paddingTop=(item.imageTop??0)+'px';
   row.append(fig);return row;
  }
  return fig}
 function openImage(item,opener){const dialog=el('dialog','block-viewer'),header=el('div','viewer-toolbar'),close=el('button','','Cerrar ×'),image=el('img');header.append(el('h2','',item.alt),close);if(item.assetId)resolveAsset(item.assetId).then(url=>{if(image.isConnected)image.src=url}).catch(()=>{image.alt='Imagen local ausente: importa la copia ZIP'});else image.src=item.src;image.alt=item.alt;dialog.append(header,image);document.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();opener.focus()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.showModal()}
 doc.blocks.forEach(block=>root.append(draw(block)));
}
