import {mapLoadingOptions} from '/map-loading.js';
let map,events,run=0,observer,trial;
const stats=()=>fetch(`/dev/network-stats?trial=${trial}`).then(r=>r.json());
const $=s=>document.querySelector(s);
$('#start').onclick=async()=>{
 if(map)map.remove();observer?.disconnect();events={requested:0,completed:0,errors:0,errorMessages:[],resources:[],runs:[]};run=0;$('#run').disabled=true;$('#start').disabled=true;$('#mode').disabled=true;$('#report').textContent='Cargando estilo y cartografía…';$('#samples').replaceChildren();
 const style=await fetch('/assets/map-style.json').then(r=>r.json());
 const tileJSON=await fetch(style.sources.openmaptiles.url).then(r=>r.json());
 style.sources.openmaptiles={type:'vector',tiles:tileJSON.tiles,minzoom:tileJSON.minzoom,maxzoom:tileJSON.maxzoom,attribution:tileJSON.attribution};
 const mode=$('#mode').value;trial=crypto.randomUUID();
 observer=new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.name.includes('/dev/network?'))events.resources.push({name:entry.name,bytes:entry.transferSize,duration:Math.round(entry.duration)})}});observer.observe({type:'resource'});
 map=new maplibregl.Map({container:'map',style,center:[28.98,41.01],zoom:4,renderWorldCopies:false,canvasContextAttributes:{preserveDrawingBuffer:true},...(mode==='improved'?mapLoadingOptions(innerWidth):{}),transformRequest:(url,type)=>{
  if(type==='Tile'&&url.startsWith('https://tiles.openfreemap.org/'))return {url:`${location.origin}/dev/network?delay=800&kbps=128&url=${encodeURIComponent(url)}&mode=${mode}&trial=${trial}`};return {url};
 }});
 map.on('dataloading',e=>{if(e.dataType==='source'&&e.tile)events.requested++});map.on('sourcedata',e=>{if(e.tile)events.completed++});map.on('error',e=>{events.errors++;events.errorMessages.push(e.error?.message||'Error desconocido')});
 map.once('idle',()=>{$('#run').disabled=false;$('#start').disabled=false;$('#mode').disabled=false;$('#state').textContent='Listo · configuración '+mode;$('#report').textContent=JSON.stringify({mode,requests:events.resources.length,errors:events.errors,errorMessages:events.errorMessages},null,2)});
};
function idle(){return new Promise(resolve=>{if(map.areTilesLoaded()&&!map.isMoving())return resolve(true);const timeout=setTimeout(()=>{map.off('idle',done);resolve(false)},45000);function done(){clearTimeout(timeout);resolve(true)}map.once('idle',done)})}
function capture(label){const image=new Image();image.alt=label;image.title=label;image.src=map.getCanvas().toDataURL();$('#samples').append(image)}
$('#run').onclick=async()=>{
 $('#run').disabled=true;$('#start').disabled=true;$('#mode').disabled=true;run++;const before=await stats(),start=performance.now();let emptySamples=0,samples=0;const data=[];
 const sampling=setInterval(()=>{const width=map.getCanvas().clientWidth,height=map.getCanvas().clientHeight;let hits=0;for(const x of [.2,.5,.8])for(const y of [.2,.5,.8]){if(map.queryRenderedFeatures([width*x,height*y]).length)hits++}if(!hits)emptySamples++;samples++;data.push(hits)},200);
 for(const zoom of [6,8,10]){map.easeTo({zoom,duration:750});await new Promise(r=>setTimeout(r,850));capture(`Vuelta ${run}, zoom ${zoom}, en carga`)}
 const settled=await idle();capture(`Vuelta ${run}, zoom 10, final`);
 for(const zoom of [8,6,4]){map.easeTo({zoom,duration:500});await new Promise(r=>setTimeout(r,600))}
 const returned=await idle();clearInterval(sampling);
 const after=await stats();
 events.runs.push({run,settled,returned,durationMs:Math.round(performance.now()-start),requests:after.requests-before.requests,bytes:after.bytes-before.bytes,aborted:after.aborted-before.aborted,proxyErrors:after.errors-before.errors,zeroFeatureSamples:emptySamples,samples,errors:events.errors,errorMessages:[...events.errorMessages]});
 $('#report').textContent=JSON.stringify({mode:$('#mode').value,note:'La muestra sin elementos visibles es un indicador, no una medición exacta de huecos. Demora por respuesta; no equivale a ancho de banda total compartido.',runs:events.runs},null,2);$('#run').disabled=false;$('#start').disabled=false;$('#mode').disabled=false;
};
