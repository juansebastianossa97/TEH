// Separate recovery views on the already allowlisted callback URL.
export function setupRecovery({auth,root=document,location=window.location,history=window.history,status,run,checked}) {
 const get=id=>root.getElementById(id);
 let mode=new URLSearchParams(location.search).get('recovery');
 let recoveryEvent=false;
 function view(next){
  mode=next;get('auth').hidden=false;get('account').hidden=true;get('signout').hidden=true;
  get('auth-form').hidden=true;get('recovery-request').hidden=next!=='request';get('new-password').hidden=next!=='1';
  get('auth-heading').textContent=next==='1'?'Elige una contraseña nueva':'Recupera tu contraseña';
  get('auth-description').textContent=next==='1'?'Guarda tu nueva contraseña para volver a entrar.':'Te enviaremos un enlace para cambiar tu contraseña.';
  get('community-title').textContent='Recupera tu acceso.';
 }
 function request(){history.replaceState(null,'','/dev/community.html?recovery=request');view('request');status('Escribe el correo con el que creaste tu cuenta.');}
 get('reset').onclick=()=>{get('recovery-email').value=get('email').value;request();};
 get('recovery-request').onsubmit=e=>{e.preventDefault();run(async()=>{
  await checked(auth.resetPasswordForEmail(get('recovery-email').value.trim(),{redirectTo:`${location.origin}/dev/community.html?recovery=1`}));
  status('Si el correo está registrado, recibirás un enlace. Ábrelo en este mismo navegador.');
 });};
 get('new-password').onsubmit=e=>{e.preventDefault();run(async()=>{
  if(get('replacement').value!==get('replacement-confirm').value)throw Error('Las contraseñas no coinciden.');
  await checked(auth.updateUser({password:get('replacement').value}));
  get('replacement').value='';get('replacement-confirm').value='';
  get('new-password').hidden=true;get('recovery-success').hidden=false;
  history.replaceState(null,'','/dev/community.html?recovery=done');
  status('Contraseña actualizada. Ya puedes volver a entrar.');
 });};
 // Never await another Auth method inside this callback (SDK session lock).
 auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){recoveryEvent=true;view('1');}});
 return {active:()=>!!mode, async start(){
  if(mode)view(mode);
  const {data,error}=await auth.getSession();
  if(recoveryEvent)mode='1';
  if(!mode)return false;
  if(mode==='done'){view('done');get('recovery-success').hidden=false;status('Tu contraseña ya fue actualizada.');return true;}
  if(mode==='1'){
   if(error||!data?.session){request();status('No se pudo validar el enlace. Solicita uno nuevo y ábrelo en el mismo navegador.',true);}
   else {view('1');status('Escribe y confirma tu nueva contraseña.');}
  }else {request();}
  return true;
 }};
}
