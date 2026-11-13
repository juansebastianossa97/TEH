# Ciudad Perdida y Mesopotamia — publicación directa

Preparadas a partir de los PDF aportados el 13 de noviembre de 2026. Se integran como publicaciones estáticas, igual que Karnak, sin cola de aprobación ni cambios en Supabase. Se conservan las siete originales, Barcelona y Karnak.

Orden actual: 10 Ciudad Perdida de Teyuna; 11 Mesopotamia · Zigurat de Ur.

## Contenido y autoría

- Teyuna: Alejandro Velez Escobar, Tomás Alejandro Rubio y Santiago Hernández. Dos fotografías citadas en su PDF, análisis de terrazas, drenaje y vivienda; diez acontecimientos con fuentes.
- Mesopotamia: Jean Carlos Fuentes Urbano, Salomé Echeverri García y Juan José Varón Llano. Se selecciona Ur como lugar concreto porque concentra el desarrollo arquitectónico del documento. Reconstrucción ilustrada del PDF, fotografía de J. P. Lawrence (DVIDS, 2009, dominio público), ilustración volumétrica y once acontecimientos.

Los créditos de los trabajos no se confunden con la autoría de las fotografías. Las imágenes tienen créditos y enlaces cuando están disponibles. Se convierten a WebP conservando su proporción, sin inventar resolución o partes faltantes.

## Decisiones editoriales

Se conserva la organización portada → análisis espacial → cronología, y la integración marcador → recorrido → Ver más. Los PDF no contienen planos verificables de Vacíos, Llenos y Nolli; no se inventaron. Se sustituyen por análisis textual y, para Ur, la ilustración volumétrica disponible. Teyuna no tiene una reconstrucción antigua verificable: sus fotografías muestran las terrazas y el contexto cultural vivo, sin atribuirles una falsa relación antes/después.

Se usa c. 650 d. C. para la evidencia residencial temprana de Teyuna, contrastada con el Ministerio de Cultura. No se fija una única fecha de fundación ni se repite el discutido 1972 como un descubrimiento incontrovertible. Se distingue el inicio del programa arqueológico (1976) de la creación del parque (1980, según el portafolio ministerial). La inscripción UNESCO de 2022 pertenece al sistema de conocimiento de los cuatro pueblos, no al sitio arqueológico.

Para Ur se omiten los jardines colgantes como evidencia segura y las fechas imprecisas de Hammurabi del PDF. Se distingue el monumento original de sus reconstrucciones. Las fechas de reinado son aproximadas, no duraciones de obra. Cada evento incorpora su fuente enlazada en el JSON y en la página.

## Archivos

- development/fixtures/teyuna-publication.json
- development/fixtures/mesopotamia-ur-publication.json
- development/cloud/static-publications.js (registro y búsqueda compartidos)
- dist/assets/teyuna/ y dist/assets/ur/

## Validación

33 pruebas automáticas satisfactorias (30 JavaScript y 3 Python), compilación de producción y verificación de rutas/recursos. Pruebas nuevas comprueban orden, deduplicación, acceso local sin sesión, autoría, validación del documento, dos portadas distintas, existencia de imágenes y filtros de las cronologías.

La revisión visual mediante el navegador integrado no pudo ejecutarse: la herramienta devolvió «Tab 3 is not part of browser session». No se afirma que se haya probado visualmente en escritorio/móvil. Los documentos usan el renderizador y los estilos adaptables existentes.
