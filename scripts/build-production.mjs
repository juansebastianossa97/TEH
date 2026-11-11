import {build} from 'esbuild';
import {cp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'site');
const routes = [
  ['/dev/community.html', '/comunidad/'],
  ['/dev/review.html', '/revision/'],
  ['/dev/exhibition.html', '/exposicion/'],
  ['/dev/geocode', '/api/geocode'],
  ['/dev/mapa', '/'],
  ['/dev/build/', '/app/'],
  ['/dev/fixtures/', '/app/fixtures/'],
  ['/dev/cloud/', '/app/cloud/'],
  ['/dev/editor.css', '/app/editor.css'],
  ['/dev/studio.css', '/app/studio.css'],
  ['/dev/', '/editor/'],
];
function publicPaths(source) {
  for (const [from, to] of routes) source = source.replaceAll(from, to);
  return source;
}
await rm(output, {recursive: true, force: true});
await cp(path.join(root, 'dist'), output, {recursive: true});
await mkdir(path.join(output, 'app/cloud'), {recursive: true});
for (const [source, route] of [['index','editor'],['community','comunidad'],['review','revision'],['exhibition','exposicion']]) {
  await mkdir(path.join(output, route), {recursive: true});
  let html = await readFile(path.join(root, 'development', source+'.html'), 'utf8');
  html = publicPaths(html).replace('Comunidad · Desarrollo', 'Comunidad').replace('Editor local','Editor');
  await writeFile(path.join(output, route, 'index.html'), html);
}
for (const name of ['editor.css','studio.css','cloud/community.css','fixtures/santa-sofia.json']) {
  const target = path.join(output,'app',name);
  await mkdir(path.dirname(target), {recursive:true});
  await cp(path.join(root,'development',name),target);
}
await build({
  absWorkingDir: root,
  entryPoints: ['editor.js','tools/task-worker.js','cloud/community.js','cloud/review.js','cloud/exhibition.js','cloud/markers.js'].map(p=>'development/'+p),
  bundle: true, format: 'esm', splitting: true, minify: true,
  external: ['/map-loading.js'], outdir: path.join(output,'app'),
  plugins: [{name:'public-routes', setup(builder) {
    builder.onLoad({filter:/\.js$/}, async ({path: file}) => {
      if (!file.startsWith(path.join(root,'development')+path.sep)) return;
      return {contents:publicPaths(await readFile(file,'utf8')),loader:'js'};
    });
  }}],
});
let html = await readFile(path.join(output,'index.html'),'utf8');
html = html.replace('</head>','<link rel="stylesheet" href="/app/cloud/community.css"></head>');
html = html.replace('</header>','<nav class="map-actions" aria-label="Navegación principal"><a class="collaborator-link" href="/comunidad/?modo=registro">Ser colaborador</a></nav></header>');
await writeFile(path.join(output,'index.html'),html);
const script = await readFile(path.join(output,'app.js'),'utf8');
await writeFile(path.join(output,'app.js'), script+'\nimport {mountPublications} from "/app/cloud/markers.js";\nmountPublications(()=>map);\n');
console.log('JSOP compilado en site/');
