import {supabase,checked} from './client.js';
import {loadDraft} from '../blocks/model.js';

import {renderDocument} from '../blocks/render.js';

function showLocalDraft(map, index) {
  const draft = loadDraft(localStorage)?.document;
  if (!map || !draft?.location) return;
  const {lat, lon, label} = draft.location;
  const center = [lon, lat];
  const pin = document.createElement('button');
  pin.type = 'button';
  const name = draft.title || label || 'Mi borrador';
  const anchor = document.createElement('div');
  anchor.className = 'geo-anchor';
  anchor.style.setProperty('--dx','12px');
  anchor.style.setProperty('--dy','-20px');
  pin.className = 'geo-destination';
  pin.setAttribute('aria-label', 'Abrir borrador ' + name);
  const dot = document.createElement('span');
  dot.className = 'geo-point';
  const badge = document.createElement('span');
  badge.className = 'geo-label';
  const number = document.createElement('small');
  number.textContent = String(index).padStart(2,'0');
  badge.append(number, name);
  pin.append(dot, badge);
  anchor.append(pin);
  new maplibregl.Marker({element: anchor}).setLngLat(center).addTo(map);
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = '/dev/editor.css';
  document.head.append(styles);
  const section = document.createElement('section');
  section.className = 'chapter';
  const heading = document.createElement('h2');
  heading.textContent = name;
  const content = document.createElement('div');
  section.append(heading, content);
  document.querySelector('#chapters').append(section);
  renderDocument(draft, content);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  pin.onclick = () => {
    map.stop();
    map.once('moveend', () => section.scrollIntoView({behavior: reduced ? 'instant' : 'smooth'}));
    map.easeTo({center,zoom:Math.max(15,map.getZoom()),duration:reduced ? 0 : 650});
  };
  document.querySelector('#mapa').classList.add('exploring');
  const zoom = Number(new URLSearchParams(location.search).get('zoom') ?? 14);
  map.jumpTo({center, zoom: Number.isFinite(zoom) ? Math.max(0.5, Math.min(18,zoom)) : 14});
  if (window.self !== window.top) return;
  const back = document.createElement('a');
  back.href = '/dev/' + (sessionStorage.getItem('jsop-map-editor-query') || '');
  back.textContent = 'Volver al borrador';
  document.querySelector('.map-actions')?.prepend(back);
}

import {chapterFields} from './chapter-template.js';

function node(tag, cls, text) {
  const element = document.createElement(tag);
  element.className = cls;
  if (text) element.textContent = text;
  return element;
}
function chapter(row, number, id) {
  const doc = row.document, point = doc.location;
  const {headline,intro,photo,secondPhoto} = chapterFields(doc,row.description);
  const section = node('section','chapter');
  section.id = id;
  const header = node('div','chapter-heading');
  const title = node('h2','',doc.title);
  title.id = 'title-' + id;
  title.tabIndex = -1;
  const heading = node('div','');
  heading.append(node('p','eyebrow',[point.label,...row.categories].filter(Boolean).join(' / ')),title);
  header.append(node('span','chapter-number',number),heading,node('span','coordinates',point.lat.toFixed(4)+'°, '+point.lon.toFixed(4)+'°'));
  const body = node('div','chapter-body');
  const copy = node('div','chapter-copy');
  copy.append(node('h3','',headline));
  for (const paragraph of intro.split(/\n\s*\n/).filter(value => value.trim())) {
    copy.append(node('p','',paragraph));
  }
  for (const [index,photoItem] of [photo,secondPhoto].entries()) {
    if (!photoItem?.assetId) continue;
    const figure = node('figure',index===0?'photo-main':'photo-secondary');
    const img = node('img','');
    img.alt = photoItem.alt || doc.title;
    figure.append(img,node('figcaption','',photoItem.caption || photoItem.title || photoItem.alt));
    (index === 0 ? body : copy).append(figure);
    (async()=>{
      const ref = await checked(supabase.from('atlas_revision_media').select('owner_id').eq('revision_id',row.revision_id).eq('asset_id',photoItem.assetId).single());
      const path = ref.owner_id+'/'+photoItem.assetId+'/full';
      const {signedUrl} = await checked(supabase.storage.from('atlas-media').createSignedUrl(path,3600));
      img.src = signedUrl;
    })().catch(()=>{img.alt='Imagen no disponible · '+img.alt;});
  }
  const more = node('a','sophia-more','Ver más');
  const arrow=node('span','','↗');arrow.setAttribute('aria-hidden','true');more.append(' ',arrow);
  more.href = '/dev/exhibition.html?id='+encodeURIComponent(row.exhibition_id);
  copy.append(more);
  body.append(copy);
  const footer = node('div','chapter-next');
  const back = node('a','','↖ Volver al mapa');
  back.href = '#mapa';
  footer.append(back,node('a',''));
  section.append(header,body,footer);
  return section;
}

export function mountPublications(getMap) {
  let last, loading=false, mounted=[], draftShown=false;
  const nav=document.querySelector('#destination-nav'), chapters=document.querySelector('#chapters');
  const originals=nav.children.length;
  async function refresh(){
    if(loading) return;
    loading=true;
    try {
      const rows=await checked(supabase.from('atlas_publications').select('exhibition_id,revision_id,document,author,description,categories,published_at').order('published_at').order('exhibition_id'));
      const signature=rows.map(r=>r.revision_id).join();
      if(last===signature) return;
      for(const item of mounted){item.marker?.remove();item.tab.remove();item.section.remove();item.fallback.remove();}
      mounted=[];
      const map=getMap();
      for(const [i,row] of rows.entries()){
        const doc=row.document, {lat,lon}=doc.location, id='ex-'+row.exhibition_id;
        const number=String(originals+i+1).padStart(2,'0');
        const section=chapter(row,number,id);
        chapters.append(section);
        const tab=node('a','chapter-tab');
        tab.href='#'+id;tab.dataset.destination=id;
        tab.append(node('span','',number),node('strong','',doc.title),node('i','','↗'));
        nav.append(tab);
        const travel=()=>document.dispatchEvent(new CustomEvent('atlas:travel',{detail:{id,name:doc.title,lat,lon}}));
        const anchor=node('div','geo-anchor');
        anchor.style.setProperty('--dx','14px');anchor.style.setProperty('--dy','12px');
        const pin=node('button','geo-destination');
        pin.setAttribute('aria-label','Viajar a '+doc.title);
        const label=node('span','geo-label');
        label.append(node('small','',number),doc.title);
        pin.append(node('span','geo-point'),label);pin.onclick=travel;anchor.append(pin);
        const marker=map && new maplibregl.Marker({element:anchor}).setLngLat([lon,lat]).addTo(map);
        const fallback=node('button','marker');
        fallback.style.left=(lon+180)/360*100+'%';fallback.style.top=(90-lat)/180*100+'%';
        fallback.append(node('span','pin'),node('span','marker-text',number+' '+doc.title));fallback.onclick=travel;
        document.querySelector('#markers').append(fallback);
        mounted.push({section,tab,marker,fallback});
      }
      const total=originals+rows.length;
      nav.style.setProperty('--chapter-count',total);
      document.querySelector('.route-intro > span').textContent='01 — '+String(total).padStart(2,'0');
      document.querySelector('.hero-heading .intro').firstChild.textContent=total+' lugares. Distintas formas de habitar la Tierra.';
      const sequence=[...chapters.querySelectorAll(':scope > section[id]')];
      for(let i=originals-1;i<sequence.length;i++){
        const next=sequence[i+1], link=sequence[i].querySelector('.chapter-next a:last-child');
        link.href=next?'#'+next.id:'#mapa';
        link.replaceChildren(node('span','',next?'SIGUIENTE DESTINO':'FIN DEL RECORRIDO'),' '+(next?.querySelector('h2')?.textContent||'El mundo')+' →');
      }
      if(last===undefined && location.hash.startsWith('#ex-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
      last=signature;
    }catch(error){console.warn('No se pudo actualizar el recorrido:',error.message);}
    finally {
      loading=false;
      if(!draftShown && new URLSearchParams(location.search).get('borrador')==='1'){
        showLocalDraft(getMap(),originals+mounted.length+1);
        draftShown=true;
      }
    }
  }
  refresh();
  const interval=setInterval(()=>{if(document.visibilityState==='visible')refresh();},15000);
  window.addEventListener('focus',refresh);
  window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
}
