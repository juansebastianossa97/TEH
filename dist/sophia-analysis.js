// Los índices corresponden a la guía de análisis de la clase.
const categories = [
  ['C', 'Contexto', 1, [
    ['Histórico', 'La revuelta de Niká destruyó la iglesia anterior en 532. Justiniano encargó la nueva Santa Sofía, inaugurada en 537.'],
    ['Ecológico-ambiental', 'En la península histórica de Estambul, la posición elevada hace visible la cúpula desde el agua. Los terremotos han condicionado las reparaciones del edificio.'],
    ['Sociodemográfico', 'La catedral reunía al clero, a la corte y a los habitantes de Constantinopla. En ceremonias imperiales, la posición de cada grupo ordenaba el uso de la nave.'],
    ['Antropológico-cultural', 'Los mosaicos cristianos y los grandes medallones de caligrafía islámica permiten reconocer dos tradiciones de culto en el mismo interior.'],
    ['Jurídico-político', 'Tras la conquista otomana de 1453, la catedral pasó a ser mezquita. Abrió como museo en 1935 y recuperó el uso de mezquita en 2020.'],
    ['Económico-productivo', 'La obra reunió canteros, albañiles y artesanos del mosaico. La variedad de mármoles da cuenta del transporte de materiales desde distintas regiones del imperio.']
  ]],
  ['F', 'Forma', 7, [
    ['Paramentación', 'El frente occidental se retranquea respecto a la plaza. Desde allí, los volúmenes escalonados se leen como un edificio exento.'],
    ['Tipología', 'En Sultanahmet, los grandes recintos religiosos y las plazas ocupan piezas urbanas de mayor escala que las manzanas residenciales.'],
    ['Plano de Nolli', 'La lámina permite seguir la continuidad espacial entre el umbral y la nave. Es una lectura del edificio y no un registro de los accesos vigentes.', 'nolli'],
    ['Plano de llenos', 'Los cuatro grandes pilares concentran la masa alrededor del centro. Las columnas de las naves laterales forman líneas de apoyos más ligeros.', 'llenos'],
    ['Plano de vacíos', 'En planta, el gran vacío central se prolonga hacia las semicúpulas. A los lados, las hileras de soportes delimitan espacios más estrechos.', 'vacios'],
    ['Traza', 'La antigua vía Mese conectaba el sector ceremonial próximo a Santa Sofía con el interior de Constantinopla.'],
    ['Trama', 'En torno al monumento, las calles cambian de dirección y dejan paso a plazas y recintos de distinto tamaño.'],
    ['Tejido', 'Santa Sofía, el antiguo hipódromo y la Mezquita Azul forman un conjunto de grandes piezas enlazadas por espacios peatonales.'],
    ['Borde', 'Al pasar de la plaza ajardinada a los muros del conjunto cambia la escala: del espacio abierto de la ciudad al perímetro monumental.'],
    ['Límite', 'En el edificio bizantino, las puertas entre el nártex y la nave marcaban el paso del vestíbulo al espacio litúrgico.'],
    ['Tipo edificatorio', 'La basílica cupulada combina una nave longitudinal con un centro cubierto por una gran cúpula.'],
    ['Elementos o partes', 'Nártex, nave, galerías y ábside organizan el interior. Cúpula, semicúpulas y minaretes de época otomana definen la silueta exterior.'],
    ['Relaciones formales', 'Dos semicúpulas prolongan el volumen central hacia el este y el oeste. Las exedras, de menor escala, continúan esa transición.'],
    ['Aula', 'La nave central es el gran espacio de reunión. Su anchura permite percibir la cúpula entera desde el nivel del suelo.'],
    ['Pórtico', 'En el acceso bizantino, el atrio porticado precedía a los vestíbulos occidentales. El nártex conservado permite leer la siguiente etapa de ese ingreso.'],
    ['Recinto', 'El ábside define una cabecera curva y diferenciada. Su posición al final de la nave le daba un papel central en la liturgia cristiana.'],
    ['Aproximación al edificio', 'En el recorrido histórico desde occidente se pasaba de los vestíbulos bajos a la nave. El cambio de altura hacía perceptible la escala de la cúpula.'],
    ['Masa', 'Desde el exterior, los contrafuertes engrosan la base del conjunto. En el interior, las ventanas al pie de la cúpula aligeran su apariencia.'],
    ['Espacios repetitivos', 'Las arcadas de las naves laterales y las galerías repiten columnas y vanos a lo largo de la nave.'],
    ['Espacios singulares', 'El espacio bajo la gran cúpula reúne la mayor altura y amplitud del conjunto.'],
    ['Simetría (equilibrio)', 'A ambos lados del eje longitudinal se corresponden galerías y naves laterales. El ábside distingue la cabecera del extremo de entrada.'],
    ['Jerarquía', 'La cúpula domina por altura y luz. Las semicúpulas y las cubiertas laterales descienden por niveles.'],
    ['Geometría', 'Cuatro pechinas enlazan el cuadrado definido por los pilares con el anillo circular de la cúpula.']
  ]],
  ['S', 'Significado', 30, [
    ['Noción', 'Hagia Sophia significa «Santa Sabiduría». La dedicación cristiana aludía a la sabiduría divina.'],
    ['Caracterización', 'La luz que entra por la base de la cúpula suaviza su encuentro con los apoyos. Desde la nave, la cubierta parece suspendida.'],
    ['Ejemplificación', 'En San Pedro paleocristiano domina el recorrido hacia el altar. Santa Sofía mantiene esa dirección y añade un segundo foco sobre la congregación: la cúpula.'],
    ['Categorización', 'En la Constantinopla bizantina coincidían aquí la sede del patriarca, la celebración religiosa y las ceremonias de la corte.'],
    ['Subdivisión', 'En una lectura vertical, el mármol reviste la zona más próxima al visitante. Por encima, los mosaicos y las superficies curvas conducen la mirada hacia la luz.'],
    ['Vinculación', 'Desde la plaza, cúpula y minaretes identifican el edificio en el horizonte. Al entrar, la cúpula pasa de ser una silueta a envolver al observador.'],
    ['Diferenciación', 'Frente a una basílica de cubierta longitudinal continua, las semicúpulas de Santa Sofía vinculan la dirección del recorrido con el centro elevado.']
  ]],
  ['U', 'Uso', 37, [
    ['Función', 'El uso de mezquita incorpora el mihrab, que señala la dirección de La Meca. Su posición ligeramente desplazada permite distinguirla del eje cristiano del ábside.'],
    ['Actividad', 'En la catedral, las procesiones avanzaban hacia la cabecera. En la oración musulmana, los fieles forman hileras orientadas hacia la alquibla.'],
    ['Usuario', 'La nave acoge a quienes participan en la oración. Para quienes recorren el edificio, las galerías ofrecen una lectura elevada del espacio central.']
  ]],
  ['T', 'Técnica y construcción', 40, [
    ['Materialidad', 'El ladrillo y el mortero forman las bóvedas. En el interior, las placas de mármol revisten los muros y las teselas de vidrio reflejan la luz.'],
    ['Sistemas de soporte', 'Las cargas de la cúpula llegan por las pechinas y los grandes arcos a cuatro pilares. Semicúpulas y contrafuertes ayudan a resistir los empujes laterales.'],
    ['Detalles constructivos', 'Entre los nervios de la cúpula se abren ventanas cerca de su arranque. Desde abajo se alternan franjas de luz y tramos de fábrica.']
  ]],
  ['Cr', 'Crónica', 0, []]
];

export const analysisGroups = categories.slice(0, 5).map(([initial, name, start, points]) => ({
  initial, name, start, labels: points.map(([label]) => label)
}));

export const sophiaAnswers = Object.fromEntries(categories.flatMap(([, , start, points]) =>
  points.map(([, body], index) => [start + index, body])
));

export function mountAnalysis(container, answers = {}, sophia = false, target = '', editorPath = '/editor/') {
  container.replaceChildren();
  container.classList.add('analysis-tiles');
  container.analysisAnswers = answers;
  const dialog = document.createElement('dialog');
  dialog.className = 'analysis-dialog';
  dialog.setAttribute('aria-label', 'Análisis arquitectónico');
  dialog.innerHTML = '<header><h2></h2><button type="button" autofocus>Cerrar ×</button></header><div class="analysis-scroll" tabindex="0"></div>';
  dialog.onclose = () => dialog.remove();
  const heading = dialog.querySelector('h2');
  const content = dialog.querySelector('.analysis-scroll');
  dialog.querySelector('button').onclick = () => dialog.close();
  for (const [initial, name, start, points] of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', name);
    button.innerHTML = '<strong></strong><span></span>';
    button.firstChild.textContent = initial;
    button.lastChild.textContent = name;
    container.append(button);
    button.onclick = () => {
      heading.textContent = name;
      content.replaceChildren();
      if (!points.length) {
        if (container.showChronicle) container.showChronicle(content);
        else content.textContent = 'Aún no hay documentos en esta crónica.';
      }
      let shown = 0;
      for (const panel of container.analysisPanels?.[initial] || []) {
        const figure = document.createElement('figure');
        const image = document.createElement('img');
        image.src = panel.src;
        image.alt = panel.alt;
        image.loading = 'lazy';
        image.style.cssText = 'display:block;width:100%;height:auto;max-width:none;max-height:none';
        const link = document.createElement('a');
        link.href = panel.src;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Ampliar lámina ↗';
        figure.style.margin = '0 0 24px';
        if (panel.title) {
          const caption = document.createElement('h4');
          caption.textContent = panel.title;
          figure.append(caption);
        }
        figure.append(image, link);
        content.append(figure);
        shown++;
      }
      points.forEach(([label, example, plate], index) => {
        const number = start + index;
        const answer = container.analysisAnswers?.[number];
        const body = typeof answer === 'string' && answer.trim() ? answer : sophia ? example : '';
        const picture = container.analysisImages?.[number];
        if (!body && !picture) return;
        shown++;
        if (number === 7 || number === 17) {
          const group = document.createElement('h3');
          group.textContent = number === 7 ? 'Forma urbana' : 'Forma del edificio';
          content.append(group);
        }
        const title = document.createElement('h4');
        title.textContent = number + '. ' + label;
        content.append(title);
        // Contributed image under its numbered subtitle, as in the curated plates.
        if (picture && container.resolveAnalysisImage) {
          const figure = document.createElement('figure');
          figure.style.margin = '0 0 16px';
          const image = document.createElement('img');
          image.alt = picture.alt || number + '. ' + label;
          image.loading = 'lazy';
          image.style.cssText = 'display:block;width:100%;height:auto;max-width:none;max-height:none';
          const link = document.createElement('a');
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Ampliar lámina ↗';
          link.hidden = true;
          figure.append(image, link);
          content.append(figure);
          Promise.resolve(container.resolveAnalysisImage(picture)).then(url => {
            image.src = url;
            link.href = url;
            link.hidden = false;
          }).catch(() => { image.alt = 'Imagen no disponible · ' + image.alt; });
        }
        if (body) {
          const paragraph = document.createElement('p');
          paragraph.textContent = body;
          content.append(paragraph);
        }
        if (sophia && plate) {
          const image = document.createElement('img');
          image.src = '/assets/sophia-' + plate + '.svg';
          image.alt = label + ' de Santa Sofía';
          content.append(image);
        }
      });
      if (sophia && points.length) {
        const sources = document.createElement('footer');
        sources.innerHTML = '<a href="https://whc.unesco.org/en/list/356/" target="_blank" rel="noopener">UNESCO</a> · <a href="https://www.metmuseum.org/es/essays/hagia-sophia-532-37" target="_blank" rel="noopener">The Metropolitan Museum of Art</a>';
        content.append(sources);
      }
      if (!shown && points.length) content.textContent = 'Aún no hay aportes en esta categoría.';
      document.body.append(dialog);
      dialog.setAttribute('aria-label', name);
      dialog.showModal();
      content.scrollTop = 0;
    };
  }
  if (target) {
    const edit = document.createElement('a');
    edit.className = 'analysis-contribute';
    edit.href = editorPath + '?analisis=' + encodeURIComponent(target);
    edit.textContent = 'Completar análisis';
    container.append(edit);
  }

}
