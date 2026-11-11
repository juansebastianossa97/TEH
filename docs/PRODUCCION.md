# Publicación de JSOP

El commit 9ebfeee carecía de comando de build de producción. El servidor local montaba development bajo /dev e inyectaba los enlaces y marcadores colaborativos. Esas operaciones ahora las ejecuta scripts/build-production.mjs.

Vercel debe usar como Root Directory la carpeta que contiene package.json y vercel.json, como Build Command npm run build y como Output Directory site. vercel.json declara estos dos últimos valores y npm ci como instalación. La compilación copia dist y añade los bundles y páginas públicas. site es generado y está excluido de Git.

## Rutas

- / muestra el mapa y el recorrido.
- /editor/ abre el editor.
- /comunidad/ ofrece registro, acceso, recuperación y panel administrativo según la cuenta.
- /revision/?id=… abre una propuesta.
- /exposicion/?id=… abre una publicación.
- /api/geocode ofrece búsqueda explícita de lugares mediante Photon.
- Las rutas antiguas /dev/ y las páginas de comunidad, revisión y exposición redirigen a las nuevas.

La función geográfica reutiliza el adaptador y caché existentes. Su limitación de frecuencia es por instancia, no distribuida entre todas las instancias de Vercel.

## Supabase

La configuración de cliente existente contiene URL y clave publishable. La compilación usa esa configuración y las políticas de Supabase para el acceso. No se necesita una service_role en Vercel.

En Authentication > URL Configuration, comprobar lo siguiente antes de publicar.

- Site URL https://teoriahistoria.vercel.app/comunidad/
- Redirect URL https://teoriahistoria.vercel.app/comunidad/
- Redirect URL https://teoriahistoria.vercel.app/comunidad/?recovery=1

Conservar las URLs locales que se utilicen para pruebas. Los callbacks usan location.origin y /comunidad/. Supabase exige que el destino figure en su lista de URLs permitidas. La lista remota actual no pudo inspeccionarse mediante las herramientas disponibles.

## Comprobación y publicación manual

Desde la raíz del proyecto ejecutar los comandos siguientes.

```sh
npm ci
npm run build
python3 scripts/check-production.py
npm test
python3 -m http.server 4190 --directory site
```

El servidor estático comprueba las páginas y recursos. La función /api/geocode y las redirecciones de vercel.json necesitan el entorno Vercel para una comprobación de integración. Puede usarse vercel dev localmente si Vercel CLI está configurado.

Cuando se apruebe la publicación, añadir solo los archivos de este cambio, crear un commit y hacer push a la rama de producción conectada a Vercel.

```sh
git add .gitignore package.json vercel.json scripts/build-production.mjs scripts/check-production.py api/geocode.py docs/PRODUCCION.md
git commit -m "Include JSOP editor and community in production build"
git push
```

Tras el despliegue comprobar registro con confirmación por correo, inicio de sesión, recuperación desde el correo y revisión con cuenta administradora. Estas verificaciones autenticadas siguen pendientes.

## Evidencia local

- Build de producción completado.
- 28 pruebas JavaScript y 3 Python aprobadas.
- Cinco páginas, dependencias HTML y chunks verificados.
- Archivos originales distintos de index.html y app.js idénticos byte a byte en la copia generada.
- Navegador sobre salida estática verificó mapa, editor, comunidad, formulario de recuperación y exigencia de sesión en revisión.
- Despliegue anterior devuelve HTTP 200 en / y 404 en /dev/community.html.
