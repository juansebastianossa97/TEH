# San Juan de Letrán

Autores: Kevin Stuart Gómez, Santiago Zapata y Alejandro Arciniegas.

Publicación curada incorporada al mapa y al recorrido, sin cola de revisión. El número es dinámico; con Barcelona y los otros destinos actuales corresponde al 12.

## Contenido y fuentes

Base: texto aportado por el usuario. Se contrastaron fechas y transformaciones con las páginas oficiales de la basílica, Italia.it y el texto de los Pactos de Letrán. Cada evento incluye su fuente enlazada. No se reproducen afirmaciones dudosas sobre el sínodo del cadáver ni la fecha de inscripción UNESCO. El IV Concilio se sitúa en 1215 y la remodelación del baptisterio en 432–440.

La portada compara un grabado del siglo XVIII de Piranesi con una fotografía de 2018 de Sonse; no se presenta el grabado como reconstrucción constantiniana ni la fotografía como tomada en 2026.

El adjunto no incluía dibujos. Se incorporan dos documentos verificables: planta Baedeker de 1900 y detalle del plano Nolli de 1748. No se inventan láminas independientes de llenos y vacíos. El Nolli utilizado es un montaje retocado documentado en Commons, no un levantamiento actual.

## Imágenes

URLs originales en `fuentes-imagenes.json`. Piranesi/Met: CC0; Baedeker y Nolli: dominio público. Fotografía: Sonse, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0/), procedente de https://flickr.com/photos/34585612@N00/44510034870. Conversión a WebP y reducción proporcional, sin recortar. Créditos visibles al desplegar cada imagen.

## Análisis contextual (PDF del grupo, 27 de noviembre de 2026)

Fuente: `Análisis Contextual Urbano y Arquitectónico — Basílica de San Juan de Letrán` (PDF de 12 páginas aportado por el usuario). El texto se copió casi literal en `document.analysis`, con ajustes mínimos de mayúsculas y puntuación.

- Puntos llenados (14 de 42): 1 Histórico, 2 Ecológico-ambiental, 3 Sociodemográfico, 4 Antropológico-cultural, 5 Jurídico-político, 6 Económico-productivo, 7 Paramentación, 8 Tipología, 9 Plano de Nolli, 12 Traza, 13 Trama, 14 Tejido, 15 Borde y 16 Límite.
- El punto 9 solo tiene en el PDF el pie de la lámina; ese pie es el texto publicado.
- El PDF no trae los puntos 10, 11 ni del 17 al 42. Aula, pórtico y recinto se mencionan dentro de Tipología, no como puntos 20–22.
- `analysisPanels`: las 13 figuras del PDF, extraídas sin redibujar y convertidas a WebP (máx. 1600 px), en `dist/assets/letran/analisis/` (C 7, F 6).
- Las figuras incluyen capturas de Google Maps, un mapa topográfico y una rosa de vientos de servicios externos; el PDF no indica créditos. No se atribuye su autoría al grupo más allá de la composición.

## Verificación

- `npm test`: 30 pruebas JavaScript y 3 Python aprobadas, incluido renderizado del documento, dos portadas distintas, recursos locales y filtrado de cronología.
- `npm run build` y `python3 scripts/check-production.py`: compilación y rutas/recursos de producción correctos.
- Las cuatro imágenes se inspeccionaron visualmente antes de incorporarlas.
- No se realizó una prueba visual del navegador en escritorio/móvil en esta entrega.
