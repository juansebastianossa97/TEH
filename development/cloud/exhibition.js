import karnak from '../fixtures/karnak-publication.json';
import {supabase,checked,hydrate} from './client.js';
import {renderDocument} from '../blocks/render.js';
import {$,el,status,run} from './ui.js';
await run(async()=>{const local=new URLSearchParams(location.search).get('id')==='karnak';const p=local?karnak:await checked(supabase.from('atlas_publications').select('*').eq('exhibition_id',new URLSearchParams(location.search).get('id')).single());document.title=`JSOP · ${p.document.title}`;$('#metadata').append(el('p',[p.author,...p.categories].filter(Boolean).join(' · ')),el('p',p.description));renderDocument(local?p.document:await hydrate(p.document,p.revision_id,status),$('#exhibition'));status('')});
