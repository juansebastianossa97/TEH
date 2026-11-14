// Approved contributions carry only the points that this contributor edited.
export function publishedAnswers(target, original, publications) {
  const result = {...original};
  for (const row of publications) {
    if (row.document.analysisTarget !== target) continue;
    Object.assign(result, row.document.analysis);
  }
  return result;
}
