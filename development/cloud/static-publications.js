import karnak from '../fixtures/karnak-publication.json' with {type:'json'};
import teyuna from '../fixtures/teyuna-publication.json' with {type:'json'};
import ur from '../fixtures/mesopotamia-ur-publication.json' with {type:'json'};

// Curated publications ship with the site and do not enter the submission queue.
export const staticPublications = [karnak, {...teyuna, mapOffset:[18,-52]}, {...ur, mapOffset:[24,-20]}];
export const findStaticPublication = id => staticPublications.find(row => row.exhibition_id === id);
export function combinePublications(remote) {
  const ids = new Set(staticPublications.map(row => row.exhibition_id));
  return [...remote.filter(row => !ids.has(row.exhibition_id)), ...staticPublications];
}
