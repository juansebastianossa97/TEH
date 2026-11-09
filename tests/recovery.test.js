import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {setupRecovery} from '../development/cloud/recovery.js';
const html=readFileSync(new URL('../development/community.html',import.meta.url),'utf8');
function fixture(search='',session=null){
 const dom=new JSDOM(html,{url:'http://localhost/dev/community.html'+search});let callback, pending, sent, updated, message;
 const auth={onAuthStateChange(fn){callback=fn},async getSession(){return {data:{session}}},async resetPasswordForEmail(email,opts){sent={email,opts};return {data:{}}},async updateUser(value){updated=value;return {data:{}}}};
 const controller=setupRecovery({auth,root:dom.window.document,location:dom.window.location,history:dom.window.history,status:s=>message=s,run:fn=>pending=fn().catch(e=>message=e.message),checked:async p=>{const r=await p;if(r.error)throw r.error;return r.data;}});
 return {controller,get:id=>dom.window.document.getElementById(id),event:e=>callback(e),submit:id=>{dom.window.document.getElementById(id).dispatchEvent(new dom.window.Event('submit',{cancelable:true}));return pending;},sent:()=>sent,updated:()=>updated,message:()=>message};
}
test('recovery request opens its own form and sends the allowlisted callback',async()=>{
 const f=fixture();await f.controller.start();f.get('email').value='test@example.invalid';f.get('reset').click();
 assert.equal(f.get('auth-form').hidden,true);assert.equal(f.get('recovery-request').hidden,false);
 await f.submit('recovery-request');assert.equal(f.sent().opts.redirectTo,'http://localhost/dev/community.html?recovery=1');
});
test('recovery callback works even when event already occurred; mismatch does not update password',async()=>{
 const f=fixture('?recovery=1',{user:{}});assert.equal(await f.controller.start(),true);
 assert.equal(f.get('new-password').hidden,false);assert.equal(f.get('auth-form').hidden,true);
 f.get('replacement').value='test-only-password';f.get('replacement-confirm').value='different';await f.submit('new-password');assert.equal(f.updated(),undefined);
 f.get('replacement-confirm').value='test-only-password';await f.submit('new-password');assert.equal(f.get('recovery-success').hidden,false);assert.equal(f.get('replacement').value,'');
});
test('missing recovery session explains failure instead of showing sign-up',async()=>{
 const f=fixture('?recovery=1');await f.controller.start();assert.equal(f.get('new-password').hidden,true);assert.equal(f.get('recovery-request').hidden,false);assert.match(f.message(),/No se pudo validar/);
});
test('recovery event during session initialization selects password view',async()=>{
 const f=fixture('',{user:{}});f.event('PASSWORD_RECOVERY');await f.controller.start();assert.equal(f.get('new-password').hidden,false);assert.equal(f.get('auth-form').hidden,true);
});
