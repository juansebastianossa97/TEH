export function setupAuthMode(root = document, initialSignup = false) {
 let signup = false;
 const get = id => root.getElementById(id);
 function setSignup(next) {
  signup = next;
  get('name-field').hidden = !signup;
  get('name').disabled = !signup;
  get('name').required = signup;
  get('auth-heading').textContent = signup ? 'Crea tu cuenta' : 'Entra para contribuir';
  get('auth-submit').textContent = signup ? 'Crear cuenta' : 'Entrar';
  get('signup').textContent = signup ? 'Ya tengo cuenta' : 'Crear una cuenta nueva';
  get('reset').hidden = signup;
  get('password').autocomplete = signup ? 'new-password' : 'current-password';
 }
 get('signup').onclick = () => setSignup(!signup);
 setSignup(initialSignup);
 return {isSignup: () => signup, showLogin: () => setSignup(false)};
}
