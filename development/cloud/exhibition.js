import {attachCuratedMedia} from './curated-media.js';
import {publishedChronicle} from './analysis-contributions.js';
import {renderChronicle} from '../tools/chronicle.js';
import {findStaticPublication} from './static-publications.js';
import {supabase,checked,hydrate,chronicleURL} from './client.js';
import {renderDocument} from '../blocks/render.js';
import {$,el,status,run} from './ui.js';
await run(async()=>{const local=findStaticPublication(new URLSearchParams(location.search).get('id'));const p=local||await checked(supabase.from('atlas_publications').select('*').eq('exhibition_id',new URLSearchParams(location.search).get('id')).single());document.title=`JSOP · ${p.document.title}`;$('#metadata').append(el('p',[p.author,...p.categories].filter(Boolean).join(' · ')));renderDocument(local?p.document:await hydrate(p.document,p.revision_id,status),$('#exhibition'));const contributions=await checked(supabase.from('atlas_publications').select('exhibition_id,revision_id,document').eq('document->>analysisTarget',p.exhibition_id).order('published_at')).catch(()=>[]);const tiles=$('#exhibition').querySelector('.analysis-tiles');if(tiles)tiles.showChronicle=content=>renderChronicle(publishedChronicle(p.exhibition_id,[p,...contributions]),content,chronicleURL);attachCuratedMedia(tiles,p);status('')});
