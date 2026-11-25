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
    const fields = document.querySelectorAll('textarea:not(.chronicle-text-input)');
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

test('cada punto del análisis acepta una imagen y se muestra bajo su subtítulo numerado', async () => {
  const {imageField} = await import('../development/tools/analysis-editor.js');
  const {validateDocument} = await import('../development/blocks/model.js');
  const {assetReferences} = await import('../development/tools/assets.js');
  const {checkSophiaSubmission, newSophiaDocument} = await import('../development/blocks/sophia-template.js');
  const {publishedImages} = await import('../development/cloud/analysis-contributions.js');
  const dom = new JSDOM('<main></main>');
  globalThis.document = dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  try {
    editAnalysis({}, () => {});
    assert.equal(document.querySelectorAll('.analysis-image-field input[type=file]').length, 42);
    document.querySelector('dialog').remove();
    const id = 'a'.repeat(64);
    const doc = newSophiaDocument();
    doc.title = 'Teyuna'; doc.analysisTarget = 'teyuna';
    let stored;
    const field = imageField(doc, 9, 'Plano de Nolli', () => {}, async () => ({id}), async records => { stored = records; }, async () => 'blob:x');
    const input = field.querySelector('input');
    Object.defineProperty(input, 'files', {value:[{name:'nolli.png'}]});
    await input.onchange();
    assert.equal(stored[0].id, id);
    assert.deepEqual(doc.analysisImages, {9:{assetId:id, alt:'9. Plano de Nolli'}});
    assert.deepEqual(validateDocument(doc), []);
    assert.deepEqual(assetReferences(doc), [id]);
    assert.doesNotThrow(() => checkSophiaSubmission(doc));
    assert.ok(validateDocument({...doc, analysisImages:{43:{assetId:id, alt:''}}}).length);
    assert.ok(validateDocument({...doc, analysisImages:{9:{assetId:id, alt:'', src:'https://x.org/a.png'}}}).length);
    const images = publishedImages('teyuna', null, [{revision_id:'r1', document:doc}]);
    assert.deepEqual(images, {9:{assetId:id, alt:'9. Plano de Nolli', revisionId:'r1'}});
    const tiles = document.querySelector('main');
    mountAnalysis(tiles, {});
    tiles.analysisImages = images;
    tiles.resolveAnalysisImage = image => 'https://example.org/' + image.revisionId + '.webp';
    document.querySelector('button[aria-label="Forma"]').click();
    await new Promise(resolve => setTimeout(resolve));
    assert.equal(document.querySelector('dialog h4').textContent, '9. Plano de Nolli');
    assert.equal(document.querySelector('dialog figure img').src, 'https://example.org/r1.webp');
    field.querySelector('button').click();
    assert.equal(doc.analysisImages, undefined);
  } finally { delete globalThis.document; dom.window.close(); }
});

test('cada letra abre solo su categoría y la crónica admite texto escrito', async () => {
  const {validateDocument} = await import('../development/blocks/model.js');
  const {renderChronicleText, renderChronicle} = await import('../development/tools/chronicle.js');
  const {publishedChronicleTexts} = await import('../development/cloud/analysis-contributions.js');
  const dom = new JSDOM('<main></main>');
  globalThis.document = dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  try {
    const doc = {};
    editAnalysis(doc, () => {}, 'C');
    assert.equal(document.querySelector('dialog h2').textContent, 'Contexto');
    assert.equal(document.querySelectorAll('textarea').length, 6);
    assert.equal(document.querySelectorAll('.analysis-image-field').length, 6);
    document.querySelector('dialog').remove();
    editAnalysis(doc, () => {}, 'Cr');
    const story = document.querySelector('.chronicle-text-input');
    story.value = 'Primer párrafo.\n\nSegundo párrafo.';
    story.dispatchEvent(new dom.window.Event('input'));
    assert.equal(doc.chronicleText, 'Primer párrafo.\n\nSegundo párrafo.');
    assert.ok(document.querySelector('.chronicle-drop input[type=file]'));
    document.querySelector('dialog').remove();
    assert.deepEqual(validateDocument({schemaVersion:1, title:'', blocks:[], chronicleText:doc.chronicleText}), []);
    const root = document.querySelector('main');
    renderChronicleText(publishedChronicleTexts('teyuna', [{document:{analysisTarget:'teyuna', chronicleText:doc.chronicleText}}]), root);
    renderChronicle([], root);
    assert.deepEqual([...root.querySelectorAll('p')].map(p => p.textContent), ['Primer párrafo.', 'Segundo párrafo.']);
  } finally { delete globalThis.document; dom.window.close(); }
});
