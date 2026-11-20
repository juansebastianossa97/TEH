import {mountAnalysis} from '/sophia-analysis.js';
import {mapLoadingOptions, observeMapLoading} from './map-loading.js?v=1';
if(location.hash==='#historia-santa-sofia')location.replace('santa-sofia.html#historia-santa-sofia');
import {places} from '/original-places.js';
const $=s=>document.querySelector(s);
const project=([lon,lat])=>[(lon+180)/360*1000,(90-lat)/180*500];
const image=(id,alt,main=false)=>`<img src="assets/${id}.jpg" alt="${alt}" loading="lazy" decoding="async" width="${main?1200:600}" height="${main?1000:400}">`;
$('#destination-nav').innerHTML=places.map((p,i)=>`<a class="chapter-tab" href="#${p.id}" data-destination="${p.id}"><span>0${i+1}</span><strong>${p.label || ({inca:'Incas',muisca:'Muiscas',roma:'Roma',egipto:'Egipto'})[p.id]}</strong><i>↗</i></a>`).join('');
$('#markers').innerHTML=places.map((p,i)=>{const[x,y]=project([p.lon,p.lat]);return `<button class="marker" data-id="${p.id}" style="left:${x/10}%;top:${y/5}%" aria-label="Viajar a ${p.name}, ${p.culture.toLowerCase()}"><span class="pin"></span><span class="marker-text"><small>0${i+1} / ${p.country}</small><strong>${p.name}</strong><b>${p.culture.toLowerCase()}</b></span></button>`}).join('');
const historicalChapter=(p,i)=>`<section id="${p.id}" class="chapter historical-chapter" aria-labelledby="title-${p.id}"><div class="chapter-heading"><span class="chapter-number">0${i+1}</span><div><p class="eyebrow">${p.country} / ${p.culture}</p><h2 id="title-${p.id}" tabindex="-1">${p.name}</h2></div><span class="coordinates">${p.coords}<br>${p.period}</span></div><div class="comparison"><figure><div class="image-label">01 / DOCUMENTO HISTÓRICO</div>${image(p.main,p.caption,true)}<figcaption>${p.caption}</figcaption></figure><figure><div class="image-label">02 / EL LUGAR HOY</div>${image(p.second,p.caption2,true)}<figcaption>${p.caption2}</figcaption></figure></div><div class="historical-copy"><div><h3>${p.headline}</h3><span class="conservation">${p.status}</span>${p.id==='bizantino'?'<div class="analysis-tiles" id="sophia-analysis"></div>':''}</div><div><p>${p.text}</p><p>${p.detail}</p><a class="source-link" href="${p.source}" target="_blank" rel="noopener">Leer más · ${p.sourceName} ↗</a>${p.id==='bizantino'?'<a class="sophia-more" href="santa-sofia.html">Ver más <span aria-hidden="true">↗</span></a>':''}</div></div><div class="chapter-next"><a href="#mapa">↖ Volver al mapa</a><a href="#${places[i+1]?.id||'mapa'}"><span>${places[i+1]?'SIGUIENTE DESTINO':'FIN DEL RECORRIDO'}</span> ${places[i+1]?.name||'El mundo'} →</a></div></section>`;
$('#chapters').innerHTML=places.map((p,i)=>p.history?historicalChapter(p,i):`<section id="${p.id}" class="chapter" aria-labelledby="title-${p.id}"><div class="chapter-heading"><span class="chapter-number">0${i+1}</span><div><p class="eyebrow">${p.country} / ${p.culture}</p><h2 id="title-${p.id}" tabindex="-1">${p.name}</h2></div><span class="coordinates">${p.coords}<br>${p.period}</span></div><div class="chapter-body"><figure class="photo-main">${image(p.main,p.caption,true)}<figcaption><span>${p.caption}</span><span>01 / 02</span></figcaption></figure><div class="chapter-copy"><h3>${p.headline}</h3><p>${p.text}</p><p>${p.detail}</p><div class="facts"><div><span>HORIZONTE CULTURAL</span><strong>${p.culture.toLowerCase()}</strong></div><div><span>PARA OBSERVAR</span><strong>${p.fact}</strong></div></div><figure class="photo-secondary">${image(p.second,p.caption2)}<figcaption><span>${p.caption2}</span><span>02 / 02</span></figcaption></figure><a class="source-link" href="${p.source}" target="_blank" rel="noopener">Leer más · ${p.sourceName} ↗</a></div></div><div class="chapter-next"><a href="#mapa">↖ Volver al mapa</a><a href="#${places[i+1]?.id||'mapa'}"><span>${i===places.length-1?'FIN DEL RECORRIDO':'SIGUIENTE DESTINO'}</span> ${places[i+1]?.name||'El mundo'} →</a></div></section>`).join('');
for (const place of places) {
 const section = document.getElementById(place.id);
 const tiles = section.querySelector('.analysis-tiles') || document.createElement('div');
 if (!tiles.isConnected) section.querySelector('.historical-copy > div, .chapter-copy').append(tiles);
 mountAnalysis(tiles, {}, place.id === 'bizantino', place.id);
}
for(let lon=-180;lon<=180;lon+=30){const[x]=project([lon,0]);$('#grid').insertAdjacentHTML('beforeend',`<path class="graticule" d="M${x} 0V500"/>`)}
for(let lat=-60;lat<=60;lat+=30){const[,y]=project([0,lat]);$('#grid').insertAdjacentHTML('beforeend',`<path class="graticule" d="M0 ${y}H1000"/>`)}
fetch('assets/land.geojson').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const polygons=data.features.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);$('#land').innerHTML=polygons.map(p=>`<path d="${p.map(r=>r.map((c,i)=>`${i?'L':'M'}${project(c).map(n=>n.toFixed(2)).join(',')}`).join('')+'Z').join('')}"/>`).join('')}).catch(()=>$('#map-error').hidden=false);
fetch('assets/credits.json').then(r=>r.json()).then(items=>{$('#credits').insertAdjacentHTML('beforeend',items.map(p=>`<p><a href="${p.source}" target="_blank" rel="noopener">${p.id}</a> · ${p.credit} · <a href="${p.license_url}" target="_blank" rel="noopener">${p.license}</a>. Imagen redimensionada; encuadre adaptado a la página.</p>`).join(''))});
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let map=null, mapReady=false, pendingArrival=null;
function go(p){document.getElementById(p.id).scrollIntoView({behavior:'instant',block:'start'});history.replaceState(null,'',`#${p.id}`);$(`#title-${p.id}`).focus({preventScroll:true})}
function cancelFlight(){const wasFlying=Boolean(pendingArrival);if(wasFlying&&map)map.off('moveend',pendingArrival);pendingArrival=null;$('#flight-status').hidden=true;if(wasFlying&&map)map.stop()}
function travel(p){cancelFlight();if(!mapReady||reduced()){go(p);return}map.stop();$('#flight-status strong').textContent=p.name;$('#flight-status').hidden=false;$('#mapa').classList.add('exploring');pendingArrival=()=>{pendingArrival=null;$('#flight-status').hidden=true;go(p)};map.once('moveend',pendingArrival);map.flyTo({center:[p.lon,p.lat],zoom:15,pitch:35,bearing:0,duration:2400,essential:false})}
document.querySelectorAll('.marker').forEach(b=>b.addEventListener('click',()=>travel(places.find(p=>p.id===b.dataset.id))));
document.addEventListener('atlas:travel', event => travel(event.detail));
$('#cancel-flight').addEventListener('click',cancelFlight);
window.addEventListener('keydown',e=>{if(e.key==='Escape')cancelFlight()});
function mapFailure(){mapReady=false;$('#map-status').hidden=false;$('#live-map').hidden=true;$('.map-tools').hidden=true;$('#mapa').classList.remove('live-ready');$('#map-status').textContent='No se pudo cargar el mapa navegable. Puedes usar los destinos del mapa y seguir el recorrido.';cancelFlight()}
async function initMap(){
 try{
  if(!window.maplibregl)throw new Error('MapLibre no disponible');
  const initialZoom=()=>innerWidth<600?0.65:innerWidth<1000?1.2:1.8;
  map=new maplibregl.Map({container:'live-map',...mapLoadingOptions(innerWidth),locale:{'NavigationControl.ZoomIn':'Acercar','NavigationControl.ZoomOut':'Alejar','NavigationControl.ResetBearing':'Orientar al norte','AttributionControl.ToggleAttribution':'Créditos del mapa'},style:'assets/map-style.json?v=3',center:[-25,22],zoom:initialZoom(),minZoom:0.5,maxZoom:18,renderWorldCopies:false,attributionControl:false,canvasContextAttributes:{antialias:true}});
  // Mayor respuesta para rueda y trackpad, conservando la animación suave.
  map.scrollZoom.setWheelZoomRate(1 / 200);
  map.scrollZoom.setZoomRate(1 / 50);
  map.addControl(new maplibregl.NavigationControl({showCompass:true}),'top-right');
  map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
  map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
  map.getCanvas().setAttribute('aria-label','Mapa del mundo. Usa las flechas para desplazarte y más o menos para cambiar el zoom.');
  const offsets={paleocristiano:[-115,25],bizantino:[30,-55],carolingio:[-105,-65],roma:[-70,85],egipto:[40,40],inca:[10,30],muisca:[-100,-40]};
  const anchors=[];
  places.forEach((p,i)=>{
   const el=document.createElement('div');el.className='geo-anchor';
   const button=document.createElement('button');button.type='button';button.className='geo-destination';button.dataset.id=p.id;button.setAttribute('aria-label',`Viajar a ${p.name}, ${p.culture.toLowerCase()}`);button.innerHTML=`<span class="geo-point" aria-hidden="true"></span><span class="geo-label"><small>0${i+1}</small> ${p.name}</span>`;
   button.addEventListener('click',e=>{e.stopPropagation();travel(p)});el.append(button);
   new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([p.lon,p.lat]).addTo(map);anchors.push({el,button,p,offset:offsets[p.id]});
  });
  function markerLayout(){
   const width=map.getContainer().clientWidth,height=map.getContainer().clientHeight;
   for(const {el,button,p,offset} of anchors){
    const point=map.project([p.lon,p.lat]);const close=map.getZoom()>9;
    el.style.visibility=point.x<0||point.x>width||point.y<0||point.y>height?'hidden':'visible';
    const box=button.getBoundingClientRect();
    const x=Math.max(8,Math.min(width-box.width-8,point.x+(close?12:offset[0])));
    const y=Math.max(8,Math.min(height-box.height-35,point.y+(close?-20:offset[1])));
    el.style.setProperty('--dx',`${x-point.x}px`);el.style.setProperty('--dy',`${y-point.y}px`);
   }
  }
  markerLayout();map.on('move',markerLayout);map.on('resize',markerLayout);
  observeMapLoading(map, {
   ready:()=>{mapReady=true;$('#live-map').hidden=false;$('#mapa').classList.add('live-ready');$('.map-tools').hidden=false;$('#map-status').hidden=true;map.resize()},
   status:message=>{$('#map-status').textContent=message;$('#map-status').hidden=!message}
  });
  map.on('movestart',e=>{if(e.originalEvent){cancelFlight();$('#mapa').classList.add('exploring')}});
  for(const event of ['wheel','pointerdown','touchstart'])map.getCanvas().addEventListener(event,()=>{cancelFlight();$('#mapa').classList.add('exploring')},{passive:true});
  $('#world-reset').addEventListener('click',()=>{cancelFlight();$('#mapa').classList.remove('exploring');map.flyTo({center:[-25,22],zoom:initialZoom(),pitch:0,bearing:0,duration:reduced()?0:1200})});
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',cancelFlight));
 }catch(error){mapFailure()}
}
initMap();
let queued=false;function update(){queued=false;const y=scrollY+innerHeight*.35;let current=null;for(const section of document.querySelectorAll('#chapters > section[id]')){if(section.offsetTop<=y)current=section.id}document.querySelectorAll('.chapter-tab').forEach(a=>{const on=a.dataset.destination===current;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});$('.progress').style.width=`${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100}%`}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});update();
if(places.some(p=>`#${p.id}`===location.hash))requestAnimationFrame(()=>document.querySelector(location.hash).scrollIntoView({behavior:'instant'}));
if('IntersectionObserver' in window&&!reduced()){
 const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:0.08});
 document.querySelectorAll('.photo-main,.chapter-copy,.comparison figure,.historical-copy').forEach(el=>{el.classList.add('reveal');revealObserver.observe(el)});
}
