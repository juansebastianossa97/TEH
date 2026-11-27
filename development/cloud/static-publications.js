import batllo from '../fixtures/batllo-publication.json' with {type:'json'};
import atenas from '../fixtures/atenas-publication.json' with {type:'json'};
import karnak from '../fixtures/karnak-publication.json' with {type:'json'};
import teyuna from '../fixtures/teyuna-publication.json' with {type:'json'};
import ur from '../fixtures/mesopotamia-ur-publication.json' with {type:'json'};

import letran from '../fixtures/letran-publication.json' with {type:'json'};

import qorikancha from '../fixtures/qorikancha-publication.json' with {type:'json'};
import capitolio from '../fixtures/capitolio-publication.json' with {type:'json'};
import secesion from '../fixtures/secesion-supplement.json' with {type:'json'};
import redHouse from '../fixtures/red-house-supplement.json' with {type:'json'};
import {formatTitle} from '../blocks/title-format.js';

// Curated publications ship with the site and do not enter the submission queue.
export const staticPublications = [karnak, {...teyuna, mapOffset:[18,-52]}, {...ur, mapOffset:[24,-20]}, {...letran, mapOffset:[28,28]}, {...qorikancha, mapOffset:[-115,-35]}, {...atenas, mapOffset:[-115,28]}, batllo, {...capitolio, mapOffset:[-40,40]}];
// Chronicles for the original map chapters, keyed by section id.
export const originalChronicles = {
  bizantino: [
    {src:'/assets/santa-sofia/cronica-1.pdf', name:'Crónica escrita a máquina · grupo de Juan Sebastián, Santiago y Samuel'},
    {src:'/assets/santa-sofia/cronica-2.pdf', name:'Crónica escrita a mano · grupo de Juan Sebastián, Santiago y Samuel'}
  ]
};
export const findStaticPublication = id => staticPublications.find(row => row.exhibition_id === id);
// Course material for exhibitions that live in Supabase: it is added to the remote row,
// which keeps its own document, images and position on the route.
export const publicationSupplements = [secesion, redHouse];
export function withSupplement(row) {
  const extra = publicationSupplements.find(item => item.exhibition_id === row.exhibition_id);
  const title = extra?.title || (row.document?.title && formatTitle(row.document.title));
  const document = title && title !== row.document.title ? {...row.document, title} : row.document;
  if (!extra) return document === row.document ? row : {...row, document};
  return {
    ...row,
    document,
    author: extra.author || row.author,
    description: row.description?.trim() ? row.description : (extra.description ?? row.description),
    analysisPanels: row.analysisPanels || extra.analysisPanels,
    chronicleFiles: [...(row.chronicleFiles || []), ...(extra.chronicleFiles || [])]
  };
}
// Exhibitions approved after this moment join the end of the route, after the curated ones,
// so the numbers that already exist never move.
export const ROUTE_FROZEN_AT = '2026-11-25T19:00:00Z';
const approvedLater = row => Boolean(row.published_at) && Date.parse(row.published_at) > Date.parse(ROUTE_FROZEN_AT);
export function combinePublications(remote) {
  const ids = new Set(staticPublications.map(row => row.exhibition_id));
  const rows = remote.filter(row => !ids.has(row.exhibition_id)).map(withSupplement);
  return [...rows.filter(row => !approvedLater(row)), ...staticPublications, ...rows.filter(approvedLater)];
}
