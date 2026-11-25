# Capitolio Nacional de Colombia · contenido preparado para JSOP

Estado: integrado directamente mediante `development/fixtures/capitolio-publication.json` y `dist/assets/capitolio-nacional/`. Se registra al final del recorrido en `development/cloud/static-publications.js` (la numeración la calcula el recorrido: en el sitio desplegado, con el Pabellón de la Secesión de Supabase en el 02, Casa Batlló es el 09 y el Capitolio será el 10). No se escribió nada en Supabase.

Autoría: Mariana Bustamante Duque y Tamara Montesdeoca Anaya (portada del trabajo final). Docente: Arq. Juan Carlos Espinosa Pasaje. Universidad Católica de Pereira, Teoría e Historia III, 2026.

## Fuentes aportadas (25 de noviembre de 2026)

- `TEORIA E HISTORIA III - TRABAJO FINAL.pdf` (11 páginas, Canva).
- `Cuando lo cotidiano se convirtió en privilegio - Tamara Anaya.pdf`: crónica firmada por Tamara Anaya (16/09/2026). Publicada como `cronica-tamara.pdf`.
- `CRONICA.pdf`, titulada «Después del terremoto»: el texto no trae nombre. Se atribuye a Mariana Bustamante Duque porque la cuenta de Canva que la generó (metadatos del PDF) es la misma que generó el trabajo final y la otra crónica es de Tamara. **Confirmar con el grupo.** Publicada como `cronica-mariana.pdf`.

## Estructura, siguiendo Casa Batlló

- Portada: ilustración de 1893 (Wikimedia Commons, dominio público) y la fotografía de la portada del trabajo como imagen actual. Créditos en `fuentes-imagenes.json`.
- `analysisPanels`: 47 láminas recortadas del PDF sin redibujar (C 6, F 25, S 7, U 6, T 3), a 220 ppp. Archivos `<categoría>-<n>-<apartado>.webp`.
- `document.analysis` vacío, como en Casa Batlló: cada apartado se presenta solo con su lámina (corrección del usuario, 25 de noviembre de 2026).
- `chronicleFiles`: las dos crónicas en PDF, accesibles desde **Cr**.
- Sin bloque de cronología: la línea de tiempo del PDF tiene solo tres periodos (el modelo de cronología exige al menos 10). Va en el punto 1 de Contexto y en la primera lámina.

## Lo que no se pudo sacar del PDF

- El punto 1 en la guía es «Histórico»; el trabajo usa «Línea de tiempo».
- Apartados del PDF sin número en la guía de 42 puntos, incluidos solo como láminas: Relación interior-exterior (sólidos y cavidades), Ritmo arquitectónico, Patrones de uso temporal, Horarios y momentos clave y Frecuencia de uso.
- Las cifras sociodemográficas (18.500 residentes, más de 1.000.000 de población flotante al día, 8.922 visitantes) no indican fuente ni año en el PDF.
- La bibliografía del trabajo cita archshaper.com, Google Earth y ChatGPT para mejorar imágenes. No hay créditos individuales por lámina ni de la foto de portada; no se atribuye su autoría a las estudiantes.
- La foto de portada parece recortada o retocada (cielo eliminado). Si se prefiere una foto con licencia, la alternativa de Wikimedia está en `fuentes-imagenes.json`.
- La ubicación (4.5977, -74.0761) corresponde a la Plaza de Bolívar de Bogotá; no figura en el PDF.

## Verificación

39 pruebas Node y 3 de Python correctas, incluida una nueva para esta exposición (`tests/static-publications.test.js`). `npm run build` compila sin errores.
