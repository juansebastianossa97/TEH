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

// Images keep their revision so Storage can check that it was approved.
export function publishedImages(target, own, publications) {
  const result = {};
  for (const [key, image] of Object.entries(own?.images || {})) result[key] = {...image, revisionId:own.revisionId};
  for (const row of publications) {
    if (row.document.analysisTarget !== target) continue;
    for (const [key, image] of Object.entries(row.document.analysisImages || {})) result[key] = {...image, revisionId:row.revision_id};
  }
  return result;
}

export function publishedChronicleTexts(target, publications) {
  return publications.filter(row => row.exhibition_id === target || row.document.analysisTarget === target)
    .map(row => row.document.chronicleText).filter(Boolean);
}
