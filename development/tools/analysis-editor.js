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
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  document.body.append(dialog);
  dialog.showModal();
}
