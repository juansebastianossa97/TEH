import {coordinates} from './location-model.js';
import {mapLoadingOptions} from '/map-loading.js';
export function mountLocation(root,getDocument,onChange,saveLocal){
 const dialog=document.createElement('dialog');dialog.className='location-dialog';
 dialog.innerHTML='<header><h2>Ubicación de la exposición</h2><button type="button" class="close-location">Cerrar</button></header><p>Busca una construcción o haz clic en el mapa. Arrastra el marcador para ajustar el punto. Solo se guarda en este borrador.</p><button type="button" class="preview-location">Guardar y probar en el mapa local</button><form class="geo-search"><label>Construcción o lugar<input name="query" required minlength="3" maxlength="180" placeholder="Santa Sofía, Estambul"></label><button>Buscar lugar</button></form><p class="geo-status" role="status"></p><div class="geo-results"></div><div class="location-map" role="region" aria-label="Mapa para elegir ubicación"></div><div class="coordinates"><label>Nombre del lugar<input name="place-label" maxlength="500"></label><label>Latitud<input name="latitude" type="number" step="any" min="-90" max="90"></label><label>Longitud<input name="longitude" type="number" step="any" min="-180" max="180"></label><button type="button" class="apply-coordinates">Guardar coordenadas</button><button type="button" class="remove-location">Quitar ubicación</button></div><p>Geocodificación: Photon · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap (ODbL)</a>. Búsqueda manual, sin autocompletado. El servicio puede no estar disponible.</p>';
 root.append(dialog);let map,marker,request,generation=0;
 const $=s=>dialog.querySelector(s),status=text=>$('.geo-status').textContent=text;
 function sync(){const value=getDocument().location;$('[name=latitude]').value=value?.lat??'';$('[name=longitude]').value=value?.lon??'';$('[name=place-label]').value=value?.label??'';if(value&&map){if(!marker){marker=new maplibregl.Marker({draggable:true,color:'#d9af71'}).setLngLat([value.lon,value.lat]).addTo(map);marker.on('dragend',()=>{const point=marker.getLngLat();apply(point.lat,point.lng,false)})}marker.setLngLat([value.lon,value.lat]);marker.getElement().setAttribute('aria-label','Ubicación de '+(value.label||getDocument().title))}else marker?.remove();if(!value)marker=null}
 function apply(lat,lon,fly=true,label=$('[name=place-label]').value,provider='manual'){try{getDocument().location=coordinates(lat,lon,label,provider);onChange();sync();if(fly)map?.flyTo({center:[Number(lon),Number(lat)],zoom:15});status('Ubicación guardada en el borrador. El marcador muestra dónde aparecería.')}catch(e){status(e.message)}}
 $('.close-location').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{generation++;request?.abort();map?.remove();map=null;marker=null});
 $('.preview-location').onclick = () => {
   try {
     const current = getDocument().location;
     const point = coordinates($('[name=latitude]').value, $('[name=longitude]').value, $('[name=place-label]').value);
     if (current?.lat === point.lat && current.lon === point.lon) point.provider = current.provider;
     getDocument().location = point;
     onChange();
     sync();
     if (!saveLocal()) {
       status('No se pudo guardar el borrador. Cierra esta ventana para ver el detalle.');
       return;
     }
     sessionStorage.setItem('jsop-map-editor-query', window.location.search);
     window.location.assign('/dev/mapa?borrador=1');
   } catch (error) {
     status(error.message);
   }
 };
 $('.apply-coordinates').onclick=()=>apply($('[name=latitude]').value,$('[name=longitude]').value);
 $('.remove-location').onclick=()=>{delete getDocument().location;onChange();sync();status('Ubicación eliminada del borrador.')};
 $('.geo-search').onsubmit=async event=>{event.preventDefault();request?.abort();request=new AbortController();const current=++generation;const button=$('.geo-search button');button.disabled=true;$('.geo-results').replaceChildren();status('Buscando…');try{const response=await fetch('/dev/geocode?q='+encodeURIComponent($('[name=query]').value.trim()),{signal:request.signal});const data=await response.json();if(!response.ok)throw Error(data.error||'Búsqueda no disponible');if(current!==generation)return;for(const place of data){const button=document.createElement('button');button.type='button';button.textContent=place.label;button.onclick=()=>{apply(place.lat,place.lon,true,place.label,'photon');$('.geo-results').replaceChildren()};$('.geo-results').append(button)}status(data.length?'Selecciona un resultado.':'No hubo resultados. Prueba otro nombre o selecciona el mapa.')}catch(e){if(e.name!=='AbortError')status(e.message)}finally{button.disabled=false}};
 return ()=>{dialog.showModal();sync();const value=getDocument().location;try{map=new maplibregl.Map({container:$('.location-map'),style:'/assets/map-style.json',center:value?[value.lon,value.lat]:[-25,22],zoom:value?14:1.8,...mapLoadingOptions(innerWidth)});map.addControl(new maplibregl.NavigationControl());map.on('click',event=>apply(event.lngLat.lat,event.lngLat.lng,false));map.on('error',()=>status('No se pudo cargar parte del mapa. Puedes introducir coordenadas manualmente.'));sync()}catch{status('Mapa no disponible. Puedes introducir coordenadas manualmente.')}};
}
