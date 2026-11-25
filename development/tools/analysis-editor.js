import {importChronicle, renderChronicle, MAX_DOCUMENTS, MAX_CHRONICLE_TEXT} from './chronicle.js';
import {analysisGroups} from '../../dist/sophia-analysis.js';
import {optimizeImage, putAssets, resolveAsset} from './assets.js';

// Optional `only` opens a single category (C, F, S, U, T or Cr), as tapped on the canvas tiles.
export function editAnalysis(doc, changed, only = '') {
  const dialog = document.createElement('dialog');
  dialog.className = 'analysis-dialog';
  dialog.setAttribute('aria-label','Editar análisis arquitectónico');
  dialog.innerHTML = '<header><h2>Análisis arquitectónico</h2><button type="button">Cerrar ×</button></header><div class="analysis-scroll"></div>';
  for (const {initial, name, start, labels} of analysisGroups) {
    if (only && only !== initial) continue;
    const details = document.createElement('details');
    details.open = Boolean(only);
    const summary = document.createElement('summary');
    summary.textContent = name;
    details.append(summary);
    labels.forEach((name, index) => {
      const key = start + index;
      const label = document.createElement('label');
      label.textContent = key + '. ' + name;
      const input = document.createElement('textarea');
      input.rows = 3;
      input.maxLength = 12000;
      input.value = doc.analysis?.[key] ?? doc.analysisReference?.[key] ?? '';
      input.oninput = () => {
        doc.analysis ??= {};
        if (input.value.trim() && input.value !== doc.analysisReference?.[key]) doc.analysis[key] = input.value;
        else delete doc.analysis[key];
        changed();
      };
      label.append(input);
      details.append(label, imageField(doc, key, name, changed));
    });
    dialog.querySelector('.analysis-scroll').append(details);
  }
  const chronicle = document.createElement('details');
  chronicle.open = only === 'Cr';
  const summary = document.createElement('summary');
  summary.textContent = 'Crónica';
  const writing = document.createElement('label');
  writing.textContent = 'Escribe la crónica (opcional)';
  const story = document.createElement('textarea');
  story.rows = 8;
  story.maxLength = MAX_CHRONICLE_TEXT;
  story.className = 'chronicle-text-input';
  story.value = doc.chronicleText || '';
  story.oninput = () => {
    if (story.value.trim()) doc.chronicleText = story.value;
    else delete doc.chronicleText;
    changed();
  };
  writing.append(story);
  const drop = document.createElement('label');
  drop.className = 'chronicle-drop';
  drop.textContent = 'Arrastra aquí PDF o Word (.docx), o selecciona archivos · Hasta 5 documentos de 25 MiB';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.docx';
  input.multiple = true;
  drop.append(input);
  const status = document.createElement('p');
  status.setAttribute('role','status');
  const list = document.createElement('div');
  let uploading = false;
  function redraw() {
    list.replaceChildren();
    for (const file of doc.chronicle || []) {
      const item = document.createElement('div');
      renderChronicle([file], item);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Quitar ' + file.name;
      remove.onclick = () => { doc.chronicle = doc.chronicle.filter(f => f.assetId !== file.assetId); changed(); redraw(); };
      item.append(remove);
      list.append(item);
    }
  }
  async function upload(files) {
    if (uploading) return;
    uploading = true;
    input.disabled = true;
    try {
      for (const file of files) {
        if ((doc.chronicle?.length || 0) >= MAX_DOCUMENTS) throw Error('Puedes añadir hasta cinco documentos.');
        status.textContent = 'Guardando ' + file.name + '…';
        const attachment = await importChronicle(file);
        doc.chronicle ??= [];
        if (!doc.chronicle.some(f => f.assetId === attachment.assetId)) doc.chronicle.push(attachment);
        changed();
        redraw();
      }
      status.textContent = 'Documentos añadidos. Guarda o envía tu propuesta a revisión.';
    } catch(error) { status.textContent = error.message; }
    finally { uploading = false; input.disabled = false; input.value = ''; }
  }
  input.onchange = () => upload([...input.files]);
  drop.ondragover = event => { event.preventDefault(); drop.classList.add('drag-over'); };
  drop.ondragleave = () => drop.classList.remove('drag-over');
  drop.ondrop = event => { event.preventDefault(); drop.classList.remove('drag-over'); upload([...event.dataTransfer.files]); };
  chronicle.append(summary, writing, drop, status, list);
  if (!only || only === 'Cr') dialog.querySelector('.analysis-scroll').append(chronicle);
  if (only) dialog.querySelector('h2').textContent = only === 'Cr' ? 'Crónica' : analysisGroups.find(group => group.initial === only)?.name || 'Análisis arquitectónico';
  redraw();
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  document.body.append(dialog);
  dialog.showModal();
}

// Each point accepts one image, shown under its numbered subtitle once published.
export function imageField(doc, key, name, changed, optimize = optimizeImage, store = putAssets, resolve = resolveAsset) {
  const field = document.createElement('div');
  field.className = 'analysis-image-field';
  const pick = document.createElement('label');
  pick.className = 'analysis-image-pick';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  const text = document.createElement('span');
  pick.append(text, input);
  const preview = document.createElement('img');
  preview.alt = '';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Eliminar imagen';
  const status = document.createElement('p');
  status.setAttribute('role','status');
  field.append(pick, preview, remove, status);
  function redraw() {
    const image = doc.analysisImages?.[key];
    text.textContent = image ? 'Cambiar imagen de ' + key + '. ' + name : 'Añadir imagen a ' + key + '. ' + name + ' (JPG, PNG o WebP)';
    remove.hidden = preview.hidden = !image;
    if (!image) { preview.removeAttribute('src'); return; }
    preview.alt = image.alt;
    resolve(image.assetId, true).then(url => { if (doc.analysisImages?.[key]?.assetId === image.assetId) preview.src = url; })
      .catch(() => { status.textContent = 'La imagen no está en este navegador. Restaura el ZIP o vuelve a añadirla.'; });
  }
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    input.disabled = true;
    status.textContent = 'Preparando ' + file.name + '…';
    try {
      const asset = await optimize(file, 'photo');
      await store([asset]);
      doc.analysisImages ??= {};
      doc.analysisImages[key] = {assetId:asset.id, alt:key + '. ' + name};
      changed();
      status.textContent = 'Imagen añadida. Guarda o envía tu propuesta a revisión.';
      redraw();
    } catch (error) { status.textContent = error.message; }
    finally { input.disabled = false; input.value = ''; }
  };
  remove.onclick = () => {
    if (!doc.analysisImages?.[key]) return;
    delete doc.analysisImages[key];
    if (!Object.keys(doc.analysisImages).length) delete doc.analysisImages;
    changed();
    status.textContent = '';
    redraw();
  };
  redraw();
  return field;
}
