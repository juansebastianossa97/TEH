# Colaboración — desarrollo, 6 de noviembre de 2026

## Ejecutar

Desde atlas-civilizaciones: `npm install`, luego `npm run dev`.

- Comunidad y administración: http://127.0.0.1:4176/dev/community.html
- Mapa con publicaciones colaborativas: http://127.0.0.1:4176/dev/mapa
- Editor local: http://127.0.0.1:4176/dev/

No se ha desplegado Vercel. Las páginas nuevas viven en development y no forman parte de dist. El servidor genera la variante del mapa reutilizando el original sin modificar sus siete exposiciones.

## Implementado

Supabase TeoriaEHistoria: Auth por correo/contraseña, perfiles, solicitudes de edición, exposiciones, revisiones, publicaciones, imágenes y registro de revisiones. Las tres migraciones en supabase/migrations están aplicadas. La clave del cliente es publicable; no hay clave secreta en el navegador.

Visitantes exploran sin cuenta. Cada cuenta verificada y activa puede preparar versiones propias. Enviar a revisión guarda el contenido y envía la versión en una sola operación. El administrador decide sobre cada envío y puede suspender cuentas. Cada envío queda congelado. La aprobación copia una versión a la publicación; preparar cambios no sustituye la versión pública. Se pueden solicitar correcciones, rechazar y aprobar retiradas. La pantalla de revisión muestra ambas versiones, comentarios y una comparación textual orientativa (la comparación visual es la referencia para cambios de orden).

Las escrituras pasan por atlas_command, con identidad, propiedad, estado y versión comprobados en PostgreSQL. RLS protege lecturas y Storage; las tablas no admiten escrituras directas de clientes. Los roles no se toman de user_metadata. Las imágenes se suben a atlas-media privado; solo las referenciadas por la publicación actual se leen sin sesión. No se permite reemplazarlas ni borrarlas desde el cliente. No hay limpieza automática de archivos huérfanos todavía.

En el editor: Archivo → Guardar en la nube. Autor, descripción y categorías se guardan junto con el documento existente. El autoguardado sigue siendo LOCAL; guardar en la nube es explícito. Abrir un borrador remoto solicita confirmación antes de reemplazar el local. IndexedDB y respaldos JSON/ZIP se conservan. Los archivos recuperados quedan también en IndexedDB: cerrar sesión no borra los respaldos locales del navegador.

Las imágenes de propuestas públicas deben subirse como archivos. Las imágenes externas o estáticas de la referencia Santa Sofía pueden usarse localmente, pero no enviarse a revisión tal cual: evita que una URL mutable cambie una publicación sin aprobación. Las siete exposiciones originales siguen funcionando como antes.

El mapa de desarrollo consulta publicaciones cada 15 segundos mientras es visible y al recuperar foco. No requiere volver a desplegar para mostrar una aprobación. Aún no está habilitado en el mapa de producción.

## Activar la cuenta administradora y probar correo

Se reservó en la tabla privada admin_bootstrap el correo juan.sebastian.ossa97@gmail.com. Todavía no existe una cuenta Auth ni se ha reclamado el rol. La reserva solo se reclama una vez al iniciar sesión con ese correo verificado.

Antes del registro, revisar en Supabase Authentication → URL Configuration:

- Site URL: `http://127.0.0.1:4176/dev/community.html` para este entorno de desarrollo.
- Redirect URLs: `http://127.0.0.1:4176/dev/community.html` y `http://127.0.0.1:4176/dev/community.html?recovery=1`.
- Mantener habilitada la confirmación del correo. No desactivarla para reclamar la reserva administrativa.

Estos ajustes NO se han verificado ni cambiado: el conector disponible no expone la configuración Auth y no se obtuvo acceso al navegador Chrome.

Revisar también Authentication → SMTP Settings. El SMTP predeterminado de Supabase solo envía a direcciones del equipo del proyecto; para registrar colaboradores externos hace falta SMTP propio. No dar acceso al equipo de Supabase a colaboradores solo para resolver el envío de correo.

Después, crear la cuenta desde Comunidad con el correo reservado y una contraseña elegida personalmente. Abrir la confirmación en el mismo navegador donde se inició el registro (PKCE); volver a entrar si fuera necesario. Debe aparecer Administración. No compartir contraseñas ni claves secretas por el chat.

Referencias: https://supabase.com/docs/guides/auth/redirect-urls y https://supabase.com/docs/guides/auth/auth-smtp

## Verificación realizada

- Build del proyecto: correcto, 49 ms en la última ejecución.
- 23 pruebas Node + 3 Python: correctas en copia temporal con instalación limpia del mismo lockfile. La ejecución en la carpeta original se detuvo al quedar esperando lectura de dependencias; los módulos existentes presentan archivos descargables de iCloud. Para repetir si ocurre, materializar la carpeta o reinstalar dependencias con `npm ci`.
- supabase/tests/collaboration.sql: ejecutada correctamente en Supabase dentro de BEGIN/ROLLBACK. Comprueba escalada de roles, solicitudes, propiedad, bloqueo de llamadas directas, concurrencia, inmutabilidad de propuestas, aprobación, correcciones, conservación de la publicación anterior, retirada, suspensión, correo no confirmado, imágenes privadas y bloqueo de sustitución/eliminación. Todos los usuarios y objetos de prueba fueron revertidos; no se enviaron correos.
- Asesor de seguridad Supabase tras migraciones: sin alertas.
- Navegador: formulario público de acceso y mapa con siete marcadores; sin errores de consola en Comunidad. Se corrigieron rutas relativas de recursos, anclas y el enlace a Santa Sofía en la variante /dev/mapa.
- Integridad: 30 archivos públicos coinciden con el registro SHA-256 anterior; cero cambios.
- Captura: development/validation/community-access.png.

## Pendiente antes de abrir a colaboradores

1. Configurar/verificar redirecciones y SMTP; registro y recuperación de contraseña con correo real.
2. Completar prueba de navegador con administrador y editor reales: solicitud → aprobación → subida → guardado → envío → comparación → publicación → propuesta de cambio → retirada. Las pruebas SQL no reemplazan este recorrido de interfaz/API de Storage.
3. Verificar móvil real: el override del navegador no aplicó el ancho solicitado; no se declara validada esa vista.
4. Prueba del mapa con una publicación real aprobada y su retirada. La base pública está vacía intencionadamente.
5. Para producción, preparar rutas, URL de autenticación, empaquetado y verificación final en staging. No es necesario rehacer el modelo de bloques. Ninguna de estas páginas está publicada en Vercel.
