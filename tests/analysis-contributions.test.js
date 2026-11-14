import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {editAnalysis} from '../development/tools/analysis-editor.js';
import {publishedAnswers} from '../development/cloud/analysis-contributions.js';
import {mountAnalysis} from '../dist/sophia-analysis.js';

test('el editor guarda un aporte parcial y el recorrido lo muestra únicamente en su destino', () => {
  const dom = new JSDOM('<main></main>');
  const doc = {analysisReference:{1:'Historia publicada'}};
  globalThis.document = dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  try {
    editAnalysis(doc, () => {});
    const fields = document.querySelectorAll('textarea');
    assert.equal(fields.length, 42);
    assert.equal(fields[0].value, 'Historia publicada');
    fields[39].value = 'Piedra tallada';
    fields[39].dispatchEvent(new dom.window.Event('input'));
    assert.deepEqual(doc.analysis, {40:'Piedra tallada'});
    document.querySelector('dialog').remove();
    const publications = [{document:{analysisTarget:'teyuna', analysis:doc.analysis}}];
    assert.deepEqual(publishedAnswers('roma', {}, publications), {});
    const answers = publishedAnswers('teyuna', {1:'Historia publicada'}, publications);
    assert.equal(answers[1], 'Historia publicada');
    mountAnalysis(document.querySelector('main'), answers);
    document.querySelector('button[aria-label="Técnica y construcción"]').click();
    assert.equal(document.querySelector('dialog p').textContent, 'Piedra tallada');
  } finally { delete globalThis.document; dom.window.close(); }
});
