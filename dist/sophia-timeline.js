const sources = {
  met: ['The Metropolitan Museum of Art', 'https://www.metmuseum.org/essays/hagia-sophia-532-37'],
  materials: ['The Metropolitan Museum of Art', 'https://www.metmuseum.org/exhibitions/listings/2012/byzantium-and-islam/blog/where-in-the-world/posts/hagia-sophia'],
  empire: ['The Metropolitan Museum of Art', 'https://www.metmuseum.org/exhibitions/listings/2004/byzantium-faith-and-power'],
  fossati: ['Museo de Cultura Bizantina', 'https://www.mbp.gr/en/exhibition/i-agia-sofia-ton-adelfon-fossati-mesa-apo-ti-2/'],
  istanbul: ['Dijital Istanbul', 'https://dijitalistanbul.org/en/hagia-sophia-grand-mosque'],
  heritage: ['UNESCO', 'https://whc.unesco.org/en/list/356/'],
  unesco: ['UNESCO', 'https://www.unesco.org/en/articles/unesco-statement-hagia-sophia-istanbul']
};
const events = [
  ['360', 'Antes del edificio actual', ['Arquitectura','Sociedad'], 'La primera iglesia', 'Bajo Constancio II se dedica la primera iglesia en este lugar. Es el comienzo de su historia, pero todavía no es el edificio que vemos hoy.', 'met'],
  ['404', 'Las iglesias anteriores', ['Sociedad'], 'Un incendio interrumpe su historia', 'La primera iglesia queda destruida durante disturbios. El destino del templo ya está ligado a los conflictos de Constantinopla.', 'met'],
  ['415', 'Las iglesias anteriores', ['Arquitectura','Política'], 'Una segunda Santa Sofía', 'Teodosio II inaugura una nueva iglesia. También desaparecerá: el monumento actual es la tercera gran construcción del lugar.', 'met'],
  ['532', 'Constantinopla bizantina', ['Política','Sociedad'], 'La revuelta de Niká', 'La segunda iglesia arde durante la rebelión contra Justiniano. El emperador ordena reconstruirla: una crisis urbana da paso a una obra monumental.', 'met'],
  ['532–537', 'Constantinopla bizantina', ['Economía','Arquitectura'], 'Los recursos de un imperio', 'La construcción reúne materiales de distintas regiones del imperio. Los mármoles y las columnas hacen visible su riqueza; entender esta obra también implica pensar en el transporte, los oficios y los recursos que la hicieron posible.', 'materials'],
  ['537', 'Constantinopla bizantina', ['Arquitectura'], 'Se inaugura el edificio actual', 'El 27 de diciembre se dedica la obra de Antemio de Trales e Isidoro de Mileto. Su gran cúpula redefine el espacio interior.', 'met'],
  ['558–562', 'Constantinopla bizantina', ['Arquitectura'], 'La cúpula se reconstruye', 'La primera cúpula colapsa en 558. Se reconstruye con un perfil más elevado y la iglesia vuelve a dedicarse en 562.', 'met'],
  ['843', 'Constantinopla bizantina', ['Arte','Sociedad'], 'El regreso de las imágenes', 'Termina la iconoclasia bizantina. Después se incorporan mosaicos figurativos: el interior cambia junto con la relación religiosa con las imágenes.', 'met'],
  ['1204', 'Una capital disputada', ['Política'], 'La Cuarta Cruzada', 'Los cruzados toman Constantinopla y comienza el dominio latino. Este cambio de poder rompe la continuidad política bizantina de la ciudad que alberga Santa Sofía.', 'empire'],
  ['1261', 'Una capital disputada', ['Política'], 'El regreso bizantino', 'Los bizantinos recuperan Constantinopla tras 57 años de dominio latino. La ciudad vuelve a ser capital imperial, en una nueva etapa de su historia religiosa y artística.', 'empire'],
  ['1453', 'Estambul otomana', ['Política','Arquitectura'], 'De iglesia a mezquita', 'Tras la conquista otomana, Mehmed II convierte Santa Sofía en mezquita. En esta nueva etapa se añaden elementos para el culto islámico; los minaretes y otras intervenciones transforman progresivamente el conjunto.', 'istanbul'],
  ['1847–1849', 'Estambul otomana', ['Arquitectura','Patrimonio'], 'Restaurar y documentar', 'Los hermanos Gaspare y Giuseppe Fossati restauran el monumento. Sus representaciones documentan una etapa de su vida otomana y permiten estudiar cómo se veía en el siglo XIX.', 'fossati'],
  ['1935', 'La República de Turquía', ['Sociedad','Patrimonio'], 'Santa Sofía abre como museo', 'Su apertura como museo introduce una nueva forma de recorrer el edificio: además de su historia religiosa, cobra protagonismo su lectura como monumento histórico y artístico.', 'istanbul'],
  ['1985', 'Un patrimonio compartido', ['Patrimonio'], 'Reconocimiento mundial', 'Las Zonas Históricas de Estambul ingresan en la Lista del Patrimonio Mundial de la UNESCO. Santa Sofía forma parte de este conjunto, reconocido por el encuentro de la arquitectura bizantina y otomana.', 'heritage'],
  ['2020', 'Un patrimonio compartido', ['Política','Sociedad','Patrimonio'], 'Un nuevo cambio de uso', 'El 10 de julio se decide su reconversión en mezquita. La UNESCO subraya la necesidad de proteger su valor universal y de mantener el acceso a este patrimonio compartido.', 'unesco']
];
const categories = ['Todos','Arquitectura','Política','Sociedad','Economía','Arte','Patrimonio'];
export function sophiaTimeline(){
 return `<section class="sophia-timeline" id="historia-santa-sofia" aria-labelledby="timeline-title"><header class="timeline-intro"><div><p class="eyebrow">SANTA SOFÍA / UNA HISTORIA EN CAPAS</p><h3 id="timeline-title">Un edificio.<br>Muchas vidas.</h3></div><div><span class="timeline-range">360 — 2020</span><p>Incendios, imperios, reconstrucciones y nuevas formas de habitar lo sagrado. Sigue los momentos que transformaron Santa Sofía y la ciudad a su alrededor.</p><p class="timeline-note">Las primeras iglesias preceden al edificio actual, construido entre 532 y 537. Las fechas están en d. C.; la distancia entre hitos no representa el tiempo transcurrido.</p></div></header><div class="timeline-filters" role="group" aria-label="Filtrar acontecimientos por tema">${categories.map((c,i)=>`<button type="button" data-timeline-filter="${c}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><p class="timeline-count" role="status" aria-live="polite">${events.length} acontecimientos · Todos los temas</p><ol class="timeline-events">${events.map(([date,era,tags,title,body,source],i)=>`<li class="timeline-event" data-themes="${tags.join('|')}"><div class="timeline-date"><span>${date}</span><small>${era}</small></div><article class="timeline-card"><div class="timeline-card-top"><span class="timeline-index">${String(i+1).padStart(2,'0')}</span><div class="timeline-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div></div><h4>${title}</h4><p>${body}</p><a href="${sources[source][1]}" target="_blank" rel="noopener" aria-label="Fuente de ${title}: ${sources[source][0]}">${sources[source][0]} ↗</a></article></li>`).join('')}</ol><p class="timeline-end">La arquitectura también cuenta la historia de quienes la transforman.</p></section>`;
}
export function initSophiaTimeline(){
 const timeline=document.querySelector('.sophia-timeline');
 timeline.querySelectorAll('[data-timeline-filter]').forEach(button=>button.addEventListener('click',()=>{
  const category=button.dataset.timelineFilter;
  timeline.querySelectorAll('[data-timeline-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let count=0;
  timeline.querySelectorAll('.timeline-event').forEach(event=>{event.hidden=category!=='Todos'&&!event.dataset.themes.split('|').includes(category);if(!event.hidden)count++});
  timeline.querySelector('.timeline-count').textContent=`${count} ${count===1?'acontecimiento':'acontecimientos'} · ${category==='Todos'?'Todos los temas':category}`;
 }));
}
