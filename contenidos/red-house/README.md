# The Red House · material del curso como complemento

Estado: complementa la exposición 03 que vive en Supabase (`exhibition_id` `5bab803f-bed9-4204-ac80-56f62ef28d99`). No se escribió nada en Supabase. La fila remota conserva su documento, su texto y sus imágenes. El complemento está en `development/fixtures/red-house-supplement.json` y `dist/assets/red-house/`, y se une a la fila con `withSupplement` en `development/cloud/static-publications.js`.

El complemento aporta:

- `author`: «Juan José Giraldo Díaz y Juan José Aristizábal», según la portada del trabajo final (Teoría e Historia III). Sustituye en el sitio al autor guardado en Supabase.
- `chronicleFiles`: dos crónicas en **Cr**: «La ciudad que no se quedó quieta» (Juan José Giraldo Díaz) y «Algo nunca previsto» (Juan José Aristizábal). Los textos no traen nombre; la autoría sale de los metadatos de cada PDF.
- `title`: el nombre se muestra como «The Red House», con el mismo formato que las demás exposiciones (en Supabase sigue como «THE RED HOUSE»).
- `analysisPanels`: 40 láminas del trabajo final (C 6, F 23, S 5, U 3, T 3), cada una con su subtítulo numerado, recortadas de las páginas 2 a 6 a 220 ppp.

## Fuente aportada (25 de noviembre de 2026)

- `Red and White Modern Architecture Presentation (216 x 279 mm) (5).pdf`: 7 páginas (autor en los metadatos: Juanjo Artunduaga).

## Lo que falta o conviene revisar

- El PDF no incluye los puntos 35 Vinculación ni 36 Diferenciación.
- La página 6 repite «Jerarquía» con el mismo texto de la página 5; solo se usó la de la página 5.
- La lámina de Pórtico conserva una frase sobrante de la plantilla («puedes analizar el acceso…»).
