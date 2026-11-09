export const $=s=>document.querySelector(s);
export function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
export function status(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error)}
export async function run(fn){document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn()}catch(e){status(e.message,true)}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
export function button(label,fn){const b=el('button',label);b.type='button';b.onclick=()=>run(fn);return b}
export function link(label,url){const a=el('a',label,'button');a.href=url;return a}
export const states={draft:'Borrador',submitted:'En revisión',approved:'Aprobada',changes_requested:'Correcciones solicitadas',rejected:'Rechazada'};
export function ask(title,{required=true}={}){return new Promise(resolve=>{const d=el('dialog'),form=el('form'),label=el('label',title),input=el('textarea'),actions=el('div',undefined,'actions');input.required=required;input.maxLength=4000;label.append(input);form.append(label,actions);const cancel=el('button','Cancelar'),ok=el('button','Continuar');cancel.type='button';cancel.onclick=()=>d.close();form.onsubmit=e=>{e.preventDefault();d.returnValue='ok';d.close()};actions.append(cancel,ok);d.append(form);document.body.append(d);d.addEventListener('close',()=>{resolve(d.returnValue==='ok'?input.value:null);d.remove()},{once:true});d.showModal()})}
