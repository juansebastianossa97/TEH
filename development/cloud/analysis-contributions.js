// Approved contributions carry only the points that this contributor edited.
export function publishedAnswers(target, original, publications) {
  const result = {...original};
  for (const row of publications) {
    if (row.document.analysisTarget !== target) continue;
    Object.assign(result, row.document.analysis);
  }
  return result;
}

// Keep each attachment tied to its approved revision for Storage access checks.
export function publishedChronicle(target, publications) {
  return publications.filter(row => row.exhibition_id === target || row.document.analysisTarget === target)
    .flatMap(row => (row.document.chronicle || []).map(file => ({...file, revisionId:row.revision_id})));
}
