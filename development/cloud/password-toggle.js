// Visibility is local to each field; never read or store the password value.
for (const toggle of document.querySelectorAll('.password-toggle')) {
 const input = document.getElementById(toggle.getAttribute('aria-controls'));
 const hide = () => {
  input.type = 'password';
  toggle.setAttribute('aria-label', 'Mostrar contraseña');
  toggle.title = 'Mostrar contraseña';
  toggle.querySelector('.eye-slash').setAttribute('hidden', '');
 };
 toggle.addEventListener('click', () => {
  if (input.type === 'text') { hide(); return; }
  input.type = 'text';
  toggle.setAttribute('aria-label', 'Ocultar contraseña');
  toggle.title = 'Ocultar contraseña';
  toggle.querySelector('.eye-slash').removeAttribute('hidden');
 });
 input.form?.addEventListener('submit', hide);
 document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
}
