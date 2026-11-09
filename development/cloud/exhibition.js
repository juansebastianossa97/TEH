import {supabase,checked,hydrate} from './client.js';
import {renderDocument} from '../blocks/render.js';
import {$,el,status,run} from './ui.js';
await run(async()=>{const p=await checked(supabase.from('atlas_publications').select('*').eq('exhibition_id',new URLSearchParams(location.search).get('id')).single());document.title=`JSOP · ${p.document.title}`;$('#metadata').append(el('p',[p.author,...p.categories].filter(Boolean).join(' · ')),el('p',p.description));renderDocument(await hydrate(p.document,p.revision_id,status),$('#exhibition'));status('')});
