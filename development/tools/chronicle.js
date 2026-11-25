import {unzipSync} from 'fflate';
import {hashBlob, putAssets, resolveAsset, MAX_IMAGE} from './assets.js';

export const PDF = 'application/pdf';
export const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const DOCUMENT_TYPES = [PDF, DOCX];
export const MAX_DOCUMENTS = 5;
export const MAX_CHRONICLE_TEXT = 40000;

// Written chronicles are shown as plain paragraphs before the attached documents.
export function renderChronicleText(texts, root) {
  for (const text of texts.filter(value => typeof value === 'string' && value.trim())) {
    const section = document.createElement('section');
    section.className = 'chronicle-document chronicle-text';
    for (const part of text.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean)) {
      const paragraph = document.createElement('p');
      paragraph.textContent = part;
      section.append(paragraph);
    }
    root.append(section);
  }
}

export function validChronicle(files) {
  return Array.isArray(files) && files.length <= MAX_DOCUMENTS && files.every(file =>
    file && /^[a-f0-9]{64}$/.test(file.assetId) && DOCUMENT_TYPES.includes(file.mime) &&
    typeof file.name === 'string' && file.name.length > 0 && file.name.length <= 300);
}

export function checkWordArchive(bytes) {
  let expanded = 0, entries = 0, documentFound = false;
  unzipSync(bytes, {filter(entry) {
    expanded += entry.originalSize;
    if (++entries > 2000 || expanded > 80 * 1024 * 1024) throw Error('El Word es demasiado grande para visualizarlo. Expórtalo como PDF.');
    if (entry.name === 'word/document.xml') documentFound = true;
    return false;
  }});
  if (!documentFound) throw Error('Este archivo no es un documento Word .docx válido.');
}

export async function importChronicle(file) {
  if (!file.size || file.size > MAX_IMAGE) throw Error('Cada documento debe pesar entre 1 byte y 25 MiB.');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['pdf','docx'].includes(extension)) throw Error('Selecciona un PDF o Word .docx. Guarda los Word .doc antiguos como .docx o PDF.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = extension === 'pdf' ? PDF : DOCX;
  if (mime === PDF && new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw Error('El archivo no contiene un PDF válido.');
  if (mime === DOCX) checkWordArchive(bytes);
  const blob = new Blob([bytes], {type:mime});
  const id = await hashBlob(blob);
  // A small placeholder keeps the existing full/thumb storage and backup format.
  const thumbnail = new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='), c=>c.charCodeAt(0))], {type:'image/png'});
  const name = file.name.slice(0,300);
  await putAssets([{id, blob, thumbnail, name, width:1, height:1, kind:'document'}]);
  return {assetId:id, name, mime};
}

export function renderChronicle(files, root, resolve = file => resolveAsset(file.assetId)) {
  if (!files?.length) {
    if (root.querySelector('.chronicle-text')) return;
    const empty = document.createElement('p');
    empty.textContent = 'Aún no hay documentos en esta crónica.';
    root.append(empty);
    return;
  }
  for (const file of files) {
    const section = document.createElement('section');
    section.className = 'chronicle-document';
    const title = document.createElement('h3');
    title.textContent = file.name;
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = 'Ver documento';
    const viewer = document.createElement('div');
    const message = document.createElement('p');
    message.setAttribute('role','status');
    section.append(title, open, message, viewer);
    root.append(section);
    open.onclick = async () => {
      open.disabled = true;
      message.textContent = 'Abriendo documento…';
      try {
        const url = await resolve(file);
        if (!section.isConnected) return;
        const download = document.createElement('a');
        download.href = url;
        download.download = file.name;
        download.target = '_blank';
        download.rel = 'noopener';
        download.textContent = 'Abrir o descargar archivo ↗';
        viewer.replaceChildren(download);
        const frame = document.createElement('iframe');
        frame.title = file.name;
        frame.className = 'chronicle-viewer';
        if (file.mime === PDF) {
          frame.src = url;
        } else {
          const response = await fetch(url);
          if (!response.ok) throw Error('No se pudo descargar el Word.');
          const arrayBuffer = await response.arrayBuffer();
          checkWordArchive(new Uint8Array(arrayBuffer));
          const [{default:mammoth}, {default:DOMPurify}] = await Promise.all([import('mammoth/mammoth.browser.js'), import('dompurify')]);
          const result = await mammoth.convertToHtml({arrayBuffer});
          const html = DOMPurify.sanitize(result.value, {USE_PROFILES:{html:true}, FORBID_TAGS:['style','form','input','button','iframe','object','embed'], FORBID_ATTR:['style']});
          frame.setAttribute('sandbox','');
          frame.srcdoc = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"><style>body{font:17px/1.7 Georgia,serif;color:#193532;padding:20px;overflow-wrap:anywhere}img,table{max-width:100%;height:auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}</style>' + html;
        }
        if (!section.isConnected) return;
        viewer.append(frame);
        message.textContent = file.mime === PDF ? 'Si tu navegador no muestra el PDF, usa Abrir o descargar archivo.' : 'Vista de lectura del Word. Descarga el archivo para conservar su formato original.';
        open.hidden = true;
      } catch(error) { message.textContent = error.message; }
      finally { open.disabled = false; }
    };
  }
}
