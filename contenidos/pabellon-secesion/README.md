# Pabellón de la Secesión · material del curso como complemento

Estado: complementa la exposición 02 que vive en Supabase (`exhibition_id` `ee7a78c2-62fc-4c24-8756-514ad5c72130`). No se escribió nada en Supabase. El complemento está en `development/fixtures/secesion-supplement.json` y `dist/assets/pabellon-secesion/`, y se une a la fila remota con `withSupplement` en `development/cloud/static-publications.js` (lo usan el recorrido y la página de la exposición).

La fila remota conserva su documento, sus imágenes (1897 y 2007) y su posición en el recorrido. El complemento solo aporta:

- `description`: texto para la pestaña principal, tomado del trabajo final. Se usa solo si la fila de Supabase no tiene descripción propia.
- `analysisPanels`: láminas del trabajo final, si la fila no trae las suyas.
- `chronicleFiles`: las dos crónicas en PDF, que se suman a las que tenga la fila.

Autoría: Santiago Ramírez Ospina y Thomas García Chica. Universidad Católica de Pereira, Teoría e Historia III, 25/10/2026. Docente: Arq. Juan Carlos Espinosa Pasaje.

## Fuentes aportadas (25 de noviembre de 2026)

- `Añadir texto (3).pdf`: trabajo final, 7 páginas (Canva). Láminas de las páginas 2 a 7, a 220 ppp.
- `EL DÍA EN QUE TODO COMENZÓ A MOVERSE.pdf`: el texto no trae nombre. Se atribuye a Thomas García Chica por el autor que figura en los metadatos del PDF. Publicada como `cronica-thomas.pdf`.
- `LA INCERTIDUMBRE DE NO SABER.pdf`: firmada por Santiago Ramírez en el título. Publicada como `cronica-santiago.pdf`.

## Láminas

44 láminas (C 6, F 22, S 7, U 6, T 3) cubren los 42 puntos, cada una con su subtítulo numerado.

- 21 Pórtico y 22 Recinto comparten una lámina: el trabajo indica que el edificio no presenta recintos.
- Tres láminas de Uso no tienen número en la guía: Horarios y momentos clave, Frecuencia de uso, y Afluencia diaria y patrones de uso temporal.

## Verificación

`tests/static-publications.test.js` comprueba que la fila de Supabase conserva su documento, que la descripción propia tiene prioridad, que los títulos cubren los puntos 1 a 42 y que todos los archivos existen.
