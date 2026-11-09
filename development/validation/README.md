# Validación funcional del editor

Validación realizada el 2 y el 4 de noviembre de 2026. Alcance: desarrollo local, sin Supabase ni despliegue. La exposición de ensayo se creó mediante los controles del editor; no se escribió una página HTML independiente ni se inyectó su JSON en el estado del navegador.

## Exposición entregada

`catedral-pereira-prueba.zip` contiene el documento y tres archivos de imagen optimizados con sus miniaturas. La portada reutiliza una imagen de la galería. `catedral-pereira-prueba.json` permite inspeccionar el documento, pero por sí solo no respalda los archivos.

Incluye portada, dos secciones con textos enriquecidos, galería de tres imágenes, cronología de dos entradas, bibliografía y coordenadas. Las imágenes son material sintético explícitamente rotulado como ensayo, no fotografías ni representaciones arquitectónicas. El evento de 2026 es una prueba del editor, no un hecho del edificio. Los datos históricos breves se contrastaron con [Pereira Travel, Arquitectura Patrimonial](https://pereira.travel/arquitectura-patrimonial/) el 2 de noviembre. No se añadieron fuentes históricas inventadas.

## Cómo reproducir

1. En la carpeta del proyecto, ejecutar `npm run dev` y abrir `http://127.0.0.1:4176/dev/`.
2. Respaldar antes cualquier trabajo propio: **Archivo → Respaldar ZIP con imágenes**.
3. **Archivo → Restaurar ZIP** y seleccionar `development/validation/catedral-pereira-prueba.zip`.
4. Revisar estructura, editar bloques, abrir Ubicación, previsualizar y ampliar las imágenes.
5. Guardar, recargar y exportar otro ZIP. Importarlo en otro origen/perfil permite comprobar una recuperación independiente de IndexedDB.

Solo existe un borrador por origen del navegador. Cambiar de puerto o de `localhost` a `127.0.0.1` cambia ese almacenamiento. El ZIP es el respaldo portable; no borrar datos del navegador sin exportarlo.

## Matriz de comprobación

| Función | Evidencia y resultado |
|---|---|
| Crear/editar bloques | Exposición construida desde cero mediante interfaz, con secciones y textos hijos. Correcto. |
| Duplicar/eliminar | Detectada copia fuera de su sección; corregida y verificada en navegador. IDs nuevos también en descendientes. |
| Ordenar secciones | Subir/bajar conserva hijos; comprobado en interfaz y tests del modelo. |
| Texto enriquecido | Negrita, cursiva, enlaces, cita, listas y títulos comprobados. Selección conservada al pulsar formatos con ratón. |
| Imágenes | Portada y tres archivos cargados con selector, metadatos editados y miniaturas recuperadas tras recarga. |
| Galería | Ordenar con botones y ampliar a imagen de 2400 px comprobado. Drop de reordenación cubierto con evento DOM automatizado; arrastre físico desde Finder no se certificó. |
| Geografía | Photon encontró Nuestra Señora de la Pobreza en Pereira; selección, coordenadas manuales y arrastre del marcador comprobados. |
| Borrador | Guardar/recargar correcto. Aviso de conflicto entre pestañas observado y cubierto por test. Recuperación también comprobada el 4 de noviembre. |
| ZIP | Exportación y restauración en origen diferente (`127.0.0.1` → `localhost`), con todas las imágenes. Tests de archivos dañados y ausentes. |
| Previsualización | Portada, secciones, imágenes, fuentes y filtros de cronología comprobados. |
| Adaptación | Escritorio, 390 × 844 y 768 × 1024: sin desbordamiento horizontal. Galería/modal y cronología comprobados a 390 px. No sustituye una prueba táctil en teléfono físico. |
| Santa Sofía | Contrato de portada, tres láminas y quince acontecimientos conservado por pruebas. |

## Correcciones

- Duplicar inserta la copia junto al bloque original dentro de su sección.
- Los bloques vacíos anidados conservan sus nodos para poder seleccionarlos y editarlos.
- Las referencias nuevas no incluyen enlaces predeterminados a UNESCO; las entradas vacías pueden permanecer en borrador y no generan enlaces públicos.
- Se pueden quitar fuentes individuales; los encabezados de los eventos se actualizan mientras se editan.
- El panel sin selección explica cómo empezar.
- Mensajes de guardado/error visibles en móvil y controles con mayor área de interacción.
- La barra de formato evita perder la selección al pulsar botones con ratón.
- Optimización de imágenes y procesamiento ZIP en worker; progreso por imagen y errores de carga. Se conserva el almacenamiento en IndexedDB y el formato ZIP existente.

## Pruebas automáticas y compilación

**23 pruebas Node y 3 Python aprobadas**, sin fallos. Salida completa: `automated-tests.txt`. La compilación del editor y del worker terminó correctamente.

La ejecución original se bloqueó leyendo una dependencia de jsdom: macOS informó `compressed,dataless` para `node_modules/css-tree/cjs/syntax/node/ClassSelector.cjs`. Para aislar el problema se copiaron las fuentes y el mismo `package-lock.json` a `/tmp/atlas-editor-validation-20261104`, se ejecutó `npm ci --ignore-scripts --no-audit --no-fund` y allí `npm test`. No se cambiaron versiones ni se sustituyó el `node_modules` del usuario. Para ejecutar localmente conviene mantener las dependencias descargadas en disco; este problema de almacenamiento sigue siendo externo al editor.

## Rendimiento y mapa

Resultados del 2 de noviembre en `map-results.json`: OpenFreeMap, configuración ajustada, 800 ms de demora y 128 KiB/s **por respuesta**, caché habilitada.

| Recorrido | Duración | Solicitudes | Bytes transferidos | Muestras sin elementos | Errores |
|---|---:|---:|---:|---:|---:|
| Primero | 9939 ms | 46 | 3272007 | 0/49 | 0 |
| Repetido | 4384 ms | 42 | 720896 | 0/21 | 0 |

Ambos recorridos alcanzaron reposo y regresaron. Las solicitudes canceladas (22 y 35) no son errores por sí solas. La segunda pasada mostró reutilización de datos. La ausencia de muestras sin elementos es un indicador, no una garantía de que nunca habrá huecos. No se simula una conexión total compartida ni una caída del proveedor. Las pruebas del controlador de carga preservan la vista previa y la caché configurada. No se modificó MapLibre en esta validación.

`image-results.json`: tres JPG de 3200 × 2100 procesados en 5035 ms, 314 latidos de interfaz y demora máxima medida de 1 ms sobre un temporizador de 16 ms. Salida total de 87946 bytes frente a 691100 bytes de entrada. Son imágenes sintéticas, no un benchmark representativo de fotografías complejas, archivos de 25 MiB o equipos móviles lentos. El harness se conserva en `performance.html`.

## Estabilidad y siguiente etapa

El flujo principal de creación local es funcional y suficientemente estable para empezar la integración de Supabase en desarrollo. No es todavía una plataforma colaborativa lista para producción.

Se pueden conservar el esquema de bloques, Tiptap, renderizador, láminas, cronología, mapa y respaldos. La siguiente etapa debe añadir adaptadores de persistencia/archivos, autenticación, roles y solicitudes, RLS y validación del servidor, revisiones separadas de la versión publicada, y lectura dinámica de exposiciones aprobadas. Los permisos no pueden depender de los controles de esta interfaz.

Pendientes de aceptación: Safari/iOS y Android físicos, teclado móvil y arrastre táctil, pruebas con exposiciones muy extensas/fotografías reales pesadas, y evaluación con una persona ajena al desarrollo. La reordenación actual se limita a hermanos; mover bloques entre secciones no forma parte de lo certificado. El ensayo no incluye una publicación real.

`public-integrity.json` comprueba que los 30 archivos de `dist` permanecieron idénticos al inicio de esta validación. No se modificaron las siete exposiciones públicas, no se desplegó en Vercel y no se conectó Supabase.
