export const plainToRich = body => ({type:'doc',content:(body||'').split(/\n\s*\n/).map(text=>({type:'paragraph',...(text?{content:[{type:'text',text}]}:{})}))});
export function safeLink(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}}
export function validRich(root){
 let count=0;
 const groups={doc:['paragraph','heading','bulletList','orderedList','blockquote'],paragraph:['text','hardBreak'],heading:['text','hardBreak'],bulletList:['listItem'],orderedList:['listItem'],listItem:['paragraph','bulletList','orderedList','blockquote'],blockquote:['paragraph','heading','bulletList','orderedList']};
 function visit(n,depth){
  if(!n||typeof n!=='object'||++count>10000||depth>16)return false;
  if(n.type==='text')return typeof n.text==='string'&&n.text.length>0&&n.text.length<=12000&&(!n.marks||Array.isArray(n.marks)&&n.marks.every(m=>m&&(['bold','italic'].includes(m.type)||m.type==='link'&&safeLink(m.attrs?.href))));
  if(n.type==='hardBreak')return !n.content;
  if(!groups[n.type]||n.type==='heading'&&![2,3].includes(n.attrs?.level))return false;
  if(n.type==='orderedList'&&n.attrs?.start!==undefined&&(!Number.isInteger(n.attrs.start)||n.attrs.start<1||n.attrs.start>10000))return false;
  return (!n.content||Array.isArray(n.content)&&n.content.every(c=>groups[n.type].includes(c?.type)&&visit(c,depth+1)))&&!n.marks;
 }
 return root?.type==='doc'&&visit(root,0);
}
export function renderRich(root){
 if(!validRich(root))throw Error('Texto enriquecido no válido');
 const tags={doc:'div',paragraph:'p',bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote',hardBreak:'br'};
 function draw(n){
  if(n.type==='text'){let node=document.createTextNode(n.text);for(const mark of n.marks||[]){const wrapper=document.createElement(mark.type==='bold'?'strong':mark.type==='italic'?'em':'a');if(mark.type==='link'){wrapper.href=mark.attrs.href;wrapper.rel='noopener noreferrer';wrapper.target='_blank'}wrapper.append(node);node=wrapper}return node}
  const node=document.createElement(n.type==='heading'?`h${n.attrs.level}`:tags[n.type]);if(n.type==='orderedList'&&n.attrs?.start)node.start=n.attrs.start;for(const child of n.content||[])node.append(draw(child));return node;
 }
 return draw(root);
}
