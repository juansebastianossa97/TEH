# Etapa 1 · Taller de exposiciones y continuidad del mapa

Este documento registra la primera etapa. Para el estado actual, instalación y herramientas nuevas, consultar [STAGE-2.md](STAGE-2.md).

Estado: desarrollo local, sin publicación, usuarios, Supabase ni cambios de contenido en los siete destinos. Ejecutar `npm run dev` desde la raíz; abrir http://127.0.0.1:4176/dev/. El sitio existente sigue en `/` y Santa Sofía sigue en `/santa-sofia.html`.

## Componentes y contrato

- `blocks/model.js`: contrato JSON versionado, validación, creación, reordenación y persistencia local.
- `blocks/render.js`: renderizador genérico compartido por edición y previsualización. No contiene textos ni condiciones específicas de Santa Sofía.
- `editor.js`: árbol de secciones, formularios, reordenación entre hermanos por arrastre o botones, duplicación, eliminación, guardado automático y manual, recuperación, importación/exportación.
- `fixtures/santa-sofia.json`: referencia de aceptación, tomada del contenido público existente: portada, sección, tres láminas ampliables y 15 eventos con categorías y fuentes.
- `editor.css`: aprovecha las fuentes, colores y estilos de la exposición pública, sin cambiar su CSS.

Documento: `{schemaVersion:1,title,blocks:[...]}`. Cada bloque tiene `id`, `type`, `title`, `layout`. Tipos: `hero` (antetítulo, introducción, portada opcional), `section` (introducción, hijos), `text` (párrafos), `plates` (imágenes y leyendas), `comparison` (dos imágenes), `timeline` (eventos, categorías y referencias), `sources` (bibliografía). Disposiciones: lectura, ancho completo, dos o tres columnas; las columnas afectan textos y galerías. Se permiten hasta 500 bloques, cinco niveles anidados, 200 eventos por línea de tiempo y documentos de hasta 2 millones de caracteres. Son límites de protección, no un número fijo de secciones.

El HTML de la exposición se genera desde JSON; no se crea una página HTML por edificio. Esta etapa usa módulos JavaScript nativos sin dependencias nuevas. El contrato y el renderizador quedan separados de la interfaz para la posterior integración con React/TypeScript y almacenamiento remoto.

El guardado es localStorage con revisión para detectar sobrescrituras habituales entre pestañas; no es una transacción multiusuario. Un error de validación conserva la última copia válida. Exportar JSON permite hacer copia externa. Borrar datos del navegador elimina el borrador local. La validación rechaza esquemas desconocidos y URL ejecutables; el renderizador usa textContent y nodos DOM, sin HTML arbitrario. Esto no sustituye permisos ni validación de backend.

## Ajuste del mapa

`dist/map-loading.js` centraliza opciones públicas compatibles con el MapLibre 5.12.0 incluido:

- `cancelPendingTileRequestsWhileZooming:false`: deja terminar solicitudes útiles de niveles anteriores para favorecer la retención nativa de teselas padre.
- `maxTileCacheSize`: 128 en pantallas estrechas y 256 en escritorio, por fuente. Es un límite de teselas, no de megabytes; el consumo depende de la zona.
- `refreshExpiredTiles:true`: respeta vigencia HTTP del proveedor. No se añaden parámetros aleatorios ni se copian teselas permanentemente en producción.
- Un arranque de más de 20 segundos muestra estado de carga sin descartar el mapa. El respaldo inicial permanece hasta recibir contenido de una tesela; los fallos parciales no ocultan la cartografía ya utilizable.

Se mantienen proveedor, estilo, gestos, marcadores, destinos y enlaces. La retención usa mecanismos de MapLibre; no se modifican internals del proveedor ni de la biblioteca. No garantiza cobertura de regiones nunca descargadas ni funcionamiento sin conexión.

Referencia técnica: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/

## Comprobaciones de red lenta · 1 de noviembre de 2026

Laboratorio reproducible en `/dev/map-lab.html`: estilo y MapLibre existentes, Estambul, recorrido zoom 4 → 6 → 8 → 10 → 8 → 6 → 4, dos vueltas por configuración. Proxy local de teselas con 800 ms de espera y 128 KiB/s **por respuesta**. Caché HTTP habilitada. El proxy guarda una copia temporal para aislar variaciones de Internet; solo acepta HTTPS de tiles.openfreemap.org. Nunca se usa en el sitio público.

| Configuración / vuelta | Solicitudes | Cancelaciones observadas por servidor | Bytes enviados | Duración | Muestras sin elementos / total |
|---|---:|---:|---:|---:|---:|
| Anterior / 1 | 70 | 56 | 1.187.409 | 7.381 ms | 3 / 36 |
| Ajustada / 1 | 48 | 24 | 3.140.935 | 9.936 ms | 0 / 49 |
| Anterior / 2 | 59 | 51 | 344.064 | 4.567 ms | 0 / 22 |
| Ajustada / 2 | 40 | 34 | 589.824 | 4.395 ms | 0 / 21 |

Ambas configuraciones llegaron a reposo y regresaron al inicio. No hubo errores del proxy. La anterior registró un evento de error de MapLibre en la segunda vuelta (no se guardó su mensaje); la ajustada registró cero en ambas. En este recorrido la ajustada hizo alrededor de 31–32% menos solicitudes y conservó información visible en las muestras. Descargó más bytes en la primera vuelta porque terminó más teselas, y esa vuelta tardó más. No se afirma una reducción general del ancho de banda ni de todos los tiempos de carga.

La segunda vuelta ajustada necesitó menos bytes que su primera vuelta, pero aún hubo peticiones/cancelaciones de niveles intermedios: la mejora no elimina todo el tráfico. Los abortos se detectan al escribir la respuesta y pueden registrarse con demora. El indicador consulta nueve puntos cada 200 ms: no mide píxeles vacíos ni demuestra ausencia de huecos parciales. La simulación no limita ancho de banda agregado y no ralentiza glifos/sprites. Falta ampliar validación a dispositivos móviles reales, cortes de conexión y navegación prolongada antes de producción.

## Aceptación y pendientes

`npm test`: 10 pruebas sobre contrato de bloques, estructura Santa Sofía, reordenación sin mutar el original, eliminación, guardado/recuperación/conflicto, URL inseguras, datos malformados y estados de carga lenta. Verificación en navegador: guardado y recuperación, portada, tres láminas, apertura/cierre de Nolli, filtros (Economía: 1 evento; Todos: 15), texto interpretado como texto, previsualización y confirmación de reemplazo.

Pendiente para etapas siguientes: editor de texto enriquecido, carga por arrastre con almacenamiento, videos seguros, metadatos geográficos y selector de mapa, varios borradores por usuario, migraciones, permisos/RLS, solicitudes de acceso, revisión administrativa y versiones publicadas inmutables. No hay autenticación ni autorización simulada. Las siete exposiciones se mantendrán en su formato actual hasta una migración separada y aprobada.
