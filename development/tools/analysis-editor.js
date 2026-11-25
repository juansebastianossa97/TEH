import {importChronicle, renderChronicle, MAX_DOCUMENTS} from './chronicle.js';
import {analysisGroups} from '../../dist/sophia-analysis.js';

export function editAnalysis(doc, changed) {
  const dialog = document.createElement('dialog');
  dialog.className = 'analysis-dialog';
  dialog.setAttribute('aria-label','Editar análisis arquitectónico');
  dialog.innerHTML = '<header><h2>Análisis arquitectónico</h2><button type="button">Cerrar ×</button></header><div class="analysis-scroll"></div>';
  for (const {name, start, labels} of analysisGroups) {
    const details = document.createElement('details');
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
      details.append(label);
    });
    dialog.querySelector('.analysis-scroll').append(details);
  }
  const chronicle = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Crónica';
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
  chronicle.append(summary, drop, status, list);
  dialog.querySelector('.analysis-scroll').append(chronicle);
  redraw();
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  document.body.append(dialog);
  dialog.showModal();
}
