# Etapa 2 · Herramientas de creación

Desarrollo local sobre los bloques existentes. No migra ni modifica las siete exposiciones, no publica contenido y no añade usuarios o permisos.

## Arranque

Requisitos: Node.js 22.13+ (o una versión LTS posterior compatible), npm, Python 3.9+ y curl.

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:4176/dev/. `npm run dev` genera el bundle del editor en `development/build/` y arranca el servidor local. No genera ni cambia `dist/`. Para otro puerto:

```sh
npm run build:editor
python3 scripts/dev-server.py --port 4177
```

Al cambiar código, volver a ejecutar `npm run build:editor` y recargar. El servidor debe reiniciarse si cambian los archivos Python. `development/build/` y `node_modules/` no se versionan. El lockfile fija las dependencias instaladas.

## Texto enriquecido

Añadir un bloque **Texto**. Tiptap ofrece párrafos, títulos H2, subtítulos H3, negrita, cursiva, listas, listas numeradas, citas, enlaces y deshacer/rehacer. Para un enlace, seleccionar texto, introducir URL HTTP/HTTPS y pulsar Aplicar enlace. Quitar enlace conserva el texto.

Los bloques antiguos con `body` siguen renderizando igual y se convierten a contenido Tiptap al editarlos. El campo opcional `content` almacena el árbol JSON de Tiptap; no se guarda HTML arbitrario. La previsualización utiliza un renderizador de nodos permitidos y enlaces validados. Los títulos H1 siguen reservados a la portada. El contrato v1 se amplía con campos opcionales; los documentos de la primera etapa son compatibles con el editor nuevo. El editor antiguo no debe usarse para editar/exportar los documentos enriquecidos nuevos.

## Imágenes y planos

Seleccionar Portada, Láminas/galería o Comparación. Elegir modo Fotografía o Plano y usar el selector de archivos o soltarlos sobre el recuadro. Formatos JPG, PNG y WebP, máximo 25 MiB por archivo y 30 imágenes por galería. PDF, SVG externo y HEIC deben exportarse a PNG previamente; los SVG locales existentes de Santa Sofía siguen funcionando por URL.

- Fotografías: WebP, lado mayor de hasta 2400 px y calidad 0,86.
- Planos: PNG sin pérdida tras reducir el lado mayor a 3200 px.
- Miniaturas: WebP hasta 800 px, carga diferida en la exposición.
- No se amplían originales pequeños. Las imágenes de más de 80 megapíxeles se rechazan.
- La ampliación abre el archivo optimizado grande. Los originales no se conservan: guardar los archivos fuente fuera del navegador si se necesita resolución de archivo.
- Cada imagen conserva título, etiqueta, texto alternativo, pie, autor, fuente y enlace. Se reordena arrastrando su tarjeta; Subir/Bajar son la alternativa de teclado.
- Una comparación tiene dos imágenes: cargar una reemplaza la primera; cargar dos reemplaza ambas. Se pueden intercambiar con los botones o arrastre.

Los blobs y miniaturas se guardan en IndexedDB `jsop-media-v1`, almacén `assets`. El documento guarda `assetId` (SHA-256 del archivo optimizado), nunca base64 ni URL blob persistente. Las URL blob se generan al visualizar. Las imágenes por URL de la etapa anterior se mantienen compatibles. Quitar una imagen del documento no elimina inmediatamente su archivo de IndexedDB, para no romper copias/borradores anteriores; la limpieza de archivos huérfanos queda para una futura biblioteca de medios.

## Respaldar y restaurar

**Exportar JSON** sigue disponible. Contiene texto, bloques, créditos, coordenadas y referencias a imágenes. No contiene los archivos de IndexedDB. Al importarlo en otro navegador se avisará si faltan archivos locales.

**Respaldar ZIP con imágenes** es la copia completa de los recursos locales añadidos:

- `exposition.json`: documento.
- `manifest.json`: metadatos y comprobaciones de integridad.
- `media/`: imágenes optimizadas y miniaturas binarias.

Para trasladar el trabajo: descargar el ZIP, abrir el taller en el otro navegador/origen, usar **Restaurar ZIP** y confirmar. Se validan documento, límites y hashes antes de guardar todos los medios en una transacción IndexedDB; después se recupera el documento. Un respaldo con imágenes ausentes o alteradas se rechaza. Límite total 150 MiB. La importación/exportación trabaja en memoria; evitar copias muy grandes en equipos con poca RAM.

El ZIP no descarga imágenes remotas ni duplica `/assets/`: esas referencias necesitan la misma instalación del proyecto o seguir disponibles en su URL. Guardar también el proyecto si se quiere archivar la referencia Santa Sofía completa. Si no se puede crear un ZIP por archivos ausentes, no se ofrece una copia parcial como completa.

El navegador puede borrar almacenamiento local; cambiar de puerto crea otro origen. Usar ZIP antes de limpiar datos, cambiar de equipo o navegador. Nada se sube a un servidor en esta etapa.

## Ubicación

Pulsar **Ubicación en el mapa**. Buscar un edificio y seleccionar el resultado, o hacer clic en el mapa. Arrastrar el marcador ajusta el punto; los campos permiten latitud/longitud precisas. El marcador es la previsualización de dónde aparecerá la exposición. Cerrar y volver a abrir conserva el punto del borrador. Quitar ubicación elimina solo este campo.

Se reutilizan MapLibre, OpenFreeMap, su estilo y sus opciones de carga. El selector no añade marcadores al mapa público. Si falla la cartografía se pueden introducir coordenadas manualmente.

La geocodificación usa Photon de komoot con datos OpenStreetMap, no el servicio público Nominatim. Condiciones consultadas: https://github.com/komoot/photon#demo-server. El proveedor permite uso razonable, puede limitar/bloquear uso intensivo y no garantiza disponibilidad. Esta integración es para desarrollo con uso moderado:

- Búsqueda explícita, sin autocompletado, consultas periódicas ni búsqueda inversa automática al arrastrar.
- Un proxy local centraliza todas las pestañas; máximo una petición cada 1,1 segundos, una a la vez.
- Caché de consultas durante siete días en la carpeta temporal `jsop-photon-cache`.
- Cinco resultados, timeout de 15 segundos, sin reintentos automáticos; pausa de 60 segundos si devuelve HTTP 429.
- Atribución Photon/OpenStreetMap visible. Buscar edificios públicos, no datos confidenciales.
- `JSOP_PHOTON_URL` permite cambiar a otra instancia HTTPS compatible al iniciar el servidor, sin cambiar la interfaz.

No ejecutar varias instancias para eludir el límite. Para varios usuarios o producción se requiere un proveedor con capacidad acordada o instancia propia y límites globales en el backend de despliegue. El proxy Python local no es un backend listo para producción.

## Pruebas

`npm test`: 17 pruebas Node y 3 Python. Incluyen compatibilidad Santa Sofía, validación del árbol enriquecido, HTML tratado como texto, enlaces peligrosos, límites geográficos, proporciones de imagen, IndexedDB con blobs, ZIP de ida/vuelta y medios alterados/ausentes, reordenación de galería por evento drop, caché del geocodificador, separación entre consultas y manejo de 429, además de los estados del mapa de la primera etapa.

Comprobaciones reales en navegador: texto con negrita/cita/enlace, carga de dos fotografías existentes, miniaturas de 800 px, reordenación, recuperación tras recarga, ampliación, búsqueda de Hagia Sophia Istanbul, elección de Ayasofya, arrastre, clic manual y entrada precisa de coordenadas. Descarga ZIP verificada: dos imágenes con miniaturas, seis archivos, 952.448 bytes de medios en esa prueba y sin base64 en el documento. La restauración se comprueba automáticamente con IndexedDB simulado; no constituye una prueba entre todos los navegadores. Se conserva el borrador de prueba en el origen local 4177.

## Conectar Supabase después

1. Definir tablas de exposiciones, versiones y medios; llevar `location` a columnas geográficas y el contenido estructurado a JSONB con contrato versionado.
2. Crear un adaptador de medios que suba blobs optimizados a Storage y transforme las referencias locales en identificadores remotos. Mantener autores/fuentes y miniaturas; ofrecer migración explícita de los borradores IndexedDB.
3. Validar en backend los documentos, dimensiones, tipos reales, tamaño y cuotas de archivos. Las validaciones actuales son de experiencia local, no permisos de acceso.
4. Implementar Auth, solicitudes de editor y roles, RLS, propiedad de borradores y aprobación administrativa. Las versiones públicas deben mantenerse separadas de las propuestas.
5. Migrar el proxy de geocodificación con caché y límites globales; mantener secretos fuera del bundle.
6. Conectar el mapa público únicamente a versiones aprobadas. No migrar ni sustituir las siete exposiciones hasta una etapa autorizada y con pruebas de equivalencia visual.

Dependencias: Tiptap 3.32.2, fflate 0.8.3; esbuild para empaquetar el taller. Guía base de Tiptap: https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript.

## Composición libre

El menú de bloques incluye **Solo un título**: escribe «Pereira» y la exposición puede consistir únicamente en esa palabra. Texto, galería y línea de tiempo se añaden de forma independiente; una sección solo sirve para agrupar si se necesita. Los bloques nuevos no incluyen contenido de ejemplo. Los bloques sin contenido se muestran como guías en edición y se ocultan en previsualización. Una comparación puede guardarse con cero, una o dos imágenes durante su preparación.

**Archivo → Nueva exposición vacía** permite empezar sin la plantilla Santa Sofía, previa confirmación. Exporta el borrador anterior antes de reemplazarlo. Los documentos existentes conservan sus contenidos.
