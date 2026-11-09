# JSOP · Clase teoria e historia 1

Proyecto independiente de Vitruvio. No modifica su navegación ni comparte dependencias.

## Abrir

Desde esta carpeta, ejecutar:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
```

Visitar http://127.0.0.1:4174. Es necesario servirlo por HTTP para cargar la cartografía local.

## Editar

- `dist/app.js`: destinos, coordenadas, textos, imágenes y enlaces históricos.
- `dist/style.css`: diseño, versión móvil y movimiento reducido.
- `dist/assets/`: catorce imágenes locales, créditos y cartografía Natural Earth.
- `dist/index.html`: estructura y metadatos.

Los marcadores animan un acercamiento cartográfico antes de desplazarse a la sección correspondiente. No es un visor satelital ni usa Google Earth. El scroll sigue siendo nativo; Escape, la rueda o un toque cancelan la transición. Los enlaces superiores y al final de cada capítulo permiten recorrer los destinos sin animación de viaje.

Fotografías de Wikimedia Commons: autores y licencias en `dist/assets/credits.json` y en el pie de página. Cartografía Natural Earth, dominio público. Fuentes históricas: UNESCO y Banco de la República, enlazadas en cada capítulo. Las imágenes, MapLibre y el estilo se sirven localmente; el mapa detallado requiere conexión a OpenFreeMap para sus teselas y tipografías; las fuentes tipográficas de Google Fonts tienen alternativas de sistema.

## Nuevos capítulos

Los tres primeros capítulos son Paleocristiano (antigua San Pedro y la basílica que la sustituyó), Bizantino (Santa Sofía) y Carolingio (Capilla Palatina de Aquisgrán). Comparan un documento histórico con una fotografía moderna, con fechas y aclaraciones sobre reconstrucciones, ampliaciones y sustituciones. Las fotos no son una vista en directo.

## Mapa navegable

MapLibre GL JS 5.12.0 está guardado en `dist/vendor/` con su licencia. El estilo `dist/assets/map-style.json` adapta Dark de OpenFreeMap a los colores de JSOP. Datos de OpenStreetMap/OpenMapTiles servidos por OpenFreeMap, con atribución visible. No requiere clave de API.

Arrastrar desplaza el mapa; rueda, pellizco, doble clic y los controles +/− cambian el zoom. Las etiquetas de países, estados/regiones, ciudades y calles aparecen según el nivel de detalle. Se priorizan los nombres en español cuando los datos los incluyen. «Ver el mundo» restaura el encuadre. «Continuar el recorrido» sale del mapa hacia los capítulos. Los marcadores vuelan a coordenadas reales antes de mostrar el capítulo. Escape o Cancelar interrumpen ese vuelo. Si WebGL o la cartografía fallan al iniciar, se ofrece el mapa estático con los siete destinos.
# TEH

## Taller local de bloques

La segunda etapa requiere Node.js 22.13+, Python 3.9+ y curl. Ejecutar `npm ci` antes de iniciar; Tiptap se empaqueta localmente.

```sh
npm run dev
npm test
```

Taller: http://127.0.0.1:4176/dev/ · Mapa: http://127.0.0.1:4176/ · Laboratorio: http://127.0.0.1:4176/dev/map-lab.html

Si el puerto está ocupado: `python3 scripts/dev-server.py --port 4177`. El borrador se guarda en el navegador y origen utilizados, no en un servidor. Exporta JSON para conservar una copia fuera del navegador.

El editor vive en `development/`, fuera de `dist/`, sin acceso a producción. Ver `development/README.md` para alcance, modelo, pruebas y pendientes.

La etapa 2 añade Tiptap, imágenes en IndexedDB, respaldos ZIP y selector geográfico. Instrucciones y límites en [development/STAGE-2.md](development/STAGE-2.md).

### Validación funcional antes de Supabase

El informe, la exposición de ensayo de la Catedral de Pereira y sus respaldos están en [development/validation/README.md](development/validation/README.md). Incluye resultados de navegador, 26 pruebas automáticas, métricas de imágenes/mapa y límites de la validación. Para abrir el ensayo usa **Archivo → Restaurar ZIP** con `development/validation/catedral-pereira-prueba.zip`; respalda primero tu borrador actual.

## Plataforma colaborativa (desarrollo)

Implementación, pruebas y pasos pendientes de autenticación: [COLABORACION.md](COLABORACION.md).
