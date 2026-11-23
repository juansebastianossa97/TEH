// Media curated from supplied course documents, separate from editable answers.
export function attachCuratedMedia(tiles, publication) {
  if (!tiles) return;
  tiles.analysisPanels = publication.analysisPanels || {};
  if (!publication.chronicleFiles?.length) return;
  const previous = tiles.showChronicle;
  tiles.showChronicle = content => {
    for (const file of publication.chronicleFiles) {
      const section = document.createElement('section');
      const title = document.createElement('h3');
      title.textContent = file.name;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Leer crónica';
      const link = document.createElement('a');
      link.href = file.src;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Abrir PDF ↗';
      link.style.marginInlineStart = '16px';
      section.append(title, button, link);
      button.onclick = () => {
        const frame = document.createElement('iframe');
        frame.src = file.src;
        frame.title = file.name;
        frame.style.cssText = 'display:block;width:100%;height:65vh;border:0;margin:16px 0';
        section.append(frame);
        button.remove();
      };
      content.append(section);
    }
    // Approved attachments remain available alongside the curated documents.
    if (previous) {
      const extra = document.createElement('div');
      previous(extra);
      if (extra.querySelector('.chronicle-document')) content.append(extra);
    }
  };
}
