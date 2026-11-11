import {newBlock} from './model.js';

export const plateLabels = ['01 / VACÍOS', '02 / LLENOS', '03 / NOLLI'];

export function newSophiaDocument() {
  const analysis = newBlock('section');
  analysis.title = 'Análisis espacial';
  analysis.children.push(newBlock('plates'));
  const timeline = newBlock('timeline');
  timeline.title = 'Línea de tiempo';
  return {schemaVersion:1, title:'', blocks:[newBlock('hero'), analysis, timeline]};
}

export function isSophiaDocument(doc) {
  const [hero, section, timeline] = doc.blocks;
  return doc.blocks.length === 3 && hero.type === 'hero' && section.type === 'section'
    && section.children.length === 1 && section.children[0].type === 'plates' && timeline.type === 'timeline';
}

export function checkSophiaSubmission(doc) {
  if (!isSophiaDocument(doc)) throw Error('Usa la plantilla de Santa Sofía: portada, análisis con tres láminas y línea de tiempo.');
}
