# Karnak · contenido preparado para JSOP

Estado: integrado directamente en el proyecto mediante development/fixtures/karnak-publication.json y dist/assets/karnak/. No requiere iniciar sesión ni importar el ZIP. Aparece en el mapa y el recorrido después de las publicaciones de Supabase; «Ver más» abre /exposicion/?id=karnak. Pendiente desplegar estos cambios para verlo en el dominio público.
Número esperado: 09, después de las siete exposiciones originales y Barcelona. La numeración definitiva la asigna el recorrido al publicar.

Autoría del análisis: Maria Antonia Guerrero, Salome Agudelo y Manuela Agudelo.

## Importación opcional (respaldo; no necesaria para mostrarlo)

1. Iniciar sesión con la cuenta administradora y abrir una nueva exposición.
2. En Archivo, restaurar `Karnak-JSOP.zip` (contiene documento y las cinco imágenes con miniaturas e integridad SHA-256).
3. Guardar en la nube, usando los datos de `metadata.json`: el ZIP existente guarda el documento y medios, pero no los metadatos administrativos de autoría/categorías.
4. Previsualizar, enviar a revisión y aprobar.
5. Comprobar el marcador 09, la sección del recorrido y «Ver más».

## Selección del documento aportado

- Página 11: reconstrucción ilustrada y vista aérea del estado conservado. No se conoce la fecha de la fotografía; no se presenta como fotografía tomada hoy.
- Página 5: Vacíos, Llenos y Nolli. Son diagramas del entorno urbano de Tebas/Luxor, no plantas interiores del templo.
- Contexto resumido de las páginas 1–3, 8–13 y 16.
- Los créditos de las imágenes originales no figuran en el PDF; no se atribuye su creación a las autoras del análisis.
- Las imágenes se conservan a la resolución extraída del PDF, sin inventar detalle. La fotografía y los planos tienen resolución limitada.

## Cronología y fuentes

Los intervalos antiguos son aproximados y corresponden a reinados; no son fechas exactas de construcción. La superposición de Hatshepsut y Tutmosis III refleja sus reinados compartidos. Cada evento incluye un enlace verificable.

- Elaine Sullivan (2010), Digital Karnak, The Development of the Temple of Karnak: https://digitalkarnak.ucsc.edu/wp-content/uploads/2020/10/developement-of-karnak-pdf_compressed.pdf
- Digital Karnak, Enclosures and Gates: https://digitalkarnak.ucsc.edu/enclosures-and-gates/
- University of Memphis, Recording Methods: https://classic.memphis.edu/hypostyle/project/r_methods.php
- UNESCO, Ancient Thebes with its Necropolis: https://whc.unesco.org/en/list/87/

## Verificación realizada

`readBackup` acepta el ZIP y verifica los hashes del contenido y sus miniaturas. `checkSophiaSubmission` acepta la plantilla. Se verificaron cinco imágenes independientes, dos portadas diferentes y trece eventos. Además se verificó el renderizado de las cinco imágenes, sus archivos en site/, la compilación de producción y las 31 pruebas existentes. Las imágenes se sirven como recursos estáticos del proyecto; no se duplicaron en Supabase. No se realizó verificación visual en navegador.

No se modificaron las siete exposiciones originales, Barcelona ni la configuración de despliegue.
