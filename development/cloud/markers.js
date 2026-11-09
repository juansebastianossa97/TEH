import {supabase,checked} from './client.js';
import {loadDraft} from '../blocks/model.js';

function showLocalDraft(map) {
  const draft = loadDraft(localStorage)?.document;
  if (!map || !draft?.location) return;
  const {lat, lon, label} = draft.location;
  const center = [lon, lat];
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'cloud-pin';
  pin.textContent = draft.title || label || 'Mi borrador';
  pin.setAttribute('aria-label', 'Acercar a ' + pin.textContent);
  pin.onclick = () => map.flyTo({center, zoom: 15});
  new maplibregl.Marker({element: pin}).setLngLat(center).addTo(map);
  document.querySelector('#mapa').classList.add('exploring');
  map.jumpTo({center, zoom: 4});
  const back = document.createElement('a');
  back.href = '/dev/' + (sessionStorage.getItem('jsop-map-editor-query') || '');
  back.textContent = 'Volver al borrador';
  document.querySelector('.map-actions')?.prepend(back);
}

export function mountPublications(getMap){
 if (new URLSearchParams(location.search).get('borrador') === '1') showLocalDraft(getMap());
 const markers=new Map();let loading=false;
 async function refresh(){const map=getMap();if(!map||loading)return;loading=true;try{
  const rows=await checked(supabase.from('atlas_publications').select('exhibition_id,document,revision_id'));
  const seen=new Set();for(const r of rows){const point=r.document.location;if(!point)continue;seen.add(r.exhibition_id);const old=markers.get(r.exhibition_id);if(old?.revision===r.revision_id)continue;old?.marker.remove();const b=document.createElement('button');b.className='cloud-pin';b.textContent=r.document.title;b.setAttribute('aria-label','Abrir exposición '+r.document.title);b.onclick=()=>{map.flyTo({center:[point.lon,point.lat],zoom:15,duration:1200});setTimeout(()=>{location.href=`/dev/exhibition.html?id=${r.exhibition_id}`},1250)};const marker=new maplibregl.Marker({element:b}).setLngLat([point.lon,point.lat]).addTo(map);markers.set(r.exhibition_id,{revision:r.revision_id,marker})}
  for(const [id,v] of markers)if(!seen.has(id)){v.marker.remove();markers.delete(id)}
 }catch(error){console.warn('No se pudieron actualizar las exposiciones colaborativas:',error.message)}finally{loading=false}}
 refresh();const interval=setInterval(()=>{if(document.visibilityState==='visible')refresh()},15000);window.addEventListener('focus',refresh);window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
}
