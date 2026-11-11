export function chapterFields(doc, description = '') {
  const blocks = [];
  function collect(items) {
    for (const block of items) {
      blocks.push(block);
      if (block.children) collect(block.children);
    }
  }
  collect(doc.blocks);
  const hero = blocks.find(b => b.type === 'hero');
  const text = blocks.find(b => b.type === 'text');
  const richText = node => node?.text || (node?.content || []).map(richText).join(' ');
  return {
    headline: hero?.title || text?.title || '',
    intro: hero?.description || description || text?.body || richText(text?.content) || blocks.find(b => b.description)?.description || '',
    secondPhoto: hero?.cover && hero?.secondCover,
    photo: hero?.cover || hero?.secondCover || blocks.find(b => ['plates','comparison'].includes(b.type) && b.items.length)?.items[0]
  };
}
