import batllo from '../fixtures/batllo-publication.json' with {type:'json'};
import atenas from '../fixtures/atenas-publication.json' with {type:'json'};
import karnak from '../fixtures/karnak-publication.json' with {type:'json'};
import teyuna from '../fixtures/teyuna-publication.json' with {type:'json'};
import ur from '../fixtures/mesopotamia-ur-publication.json' with {type:'json'};

import letran from '../fixtures/letran-publication.json' with {type:'json'};

import qorikancha from '../fixtures/qorikancha-publication.json' with {type:'json'};
import capitolio from '../fixtures/capitolio-publication.json' with {type:'json'};
import secesion from '../fixtures/secesion-supplement.json' with {type:'json'};

// Curated publications ship with the site and do not enter the submission queue.
export const staticPublications = [karnak, {...teyuna, mapOffset:[18,-52]}, {...ur, mapOffset:[24,-20]}, {...letran, mapOffset:[28,28]}, {...qorikancha, mapOffset:[-115,-35]}, {...atenas, mapOffset:[-115,28]}, batllo, {...capitolio, mapOffset:[-40,40]}];
export const findStaticPublication = id => staticPublications.find(row => row.exhibition_id === id);
// Course material for exhibitions that live in Supabase: it is added to the remote row,
// which keeps its own document, images and position on the route.
export const publicationSupplements = [secesion];
export function withSupplement(row) {
  const extra = publicationSupplements.find(item => item.exhibition_id === row.exhibition_id);
  if (!extra) return row;
  return {
    ...row,
    description: row.description?.trim() ? row.description : extra.description,
    analysisPanels: row.analysisPanels || extra.analysisPanels,
    chronicleFiles: [...(row.chronicleFiles || []), ...extra.chronicleFiles]
  };
}
export function combinePublications(remote) {
  const ids = new Set(staticPublications.map(row => row.exhibition_id));
  return [...remote.filter(row => !ids.has(row.exhibition_id)).map(withSupplement), ...staticPublications];
}
