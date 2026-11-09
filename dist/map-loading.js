// MapLibre 5.12-compatible public options. No private caches or persistent copies
// of provider tiles: HTTP freshness and the provider's URLs remain authoritative.
export function mapLoadingOptions(width = 1024) {
  return {
    cancelPendingTileRequestsWhileZooming: false,
    maxTileCacheSize: width < 600 ? 128 : 256,
    refreshExpiredTiles: true
  };
}

export function observeMapLoading(map, {ready, status}, delay = 20000) {
  let usable = false;
  let disposed = false;
  const timer = setTimeout(() => {
    if (!disposed && !map.areTilesLoaded()) status('El mapa está tardando en cargar. Conservamos la vista mientras llegan los detalles.');
  }, delay);
  const onData = event => {
    if (!usable && event.sourceId === 'openmaptiles' && event.sourceDataType === 'content' && event.coord) {
      usable = true; ready();
    }
  };
  const onLoad = () => { if (!usable) { usable = true; ready(); } };
  const onIdle = () => { if (usable && map.areTilesLoaded()) { clearTimeout(timer); status(''); } };
  const onError = () => {
    // A failed tile must never discard the rest of the map or its loaded parents.
    if (usable) status('No se pudo cargar parte del mapa. Puedes seguir explorando.');
    else status('La cartografía está tardando o no está disponible. Los destinos siguen disponibles.');
  };
  const onRemove = () => { disposed = true; clearTimeout(timer); };
  map.on('sourcedata', onData);
  map.on('load', onLoad);
  map.on('idle', onIdle);
  map.on('error', onError);
  map.on('remove', onRemove);
  return () => {
    onRemove();
    map.off('sourcedata', onData); map.off('load', onLoad); map.off('idle', onIdle);
    map.off('error', onError); map.off('remove', onRemove);
  };
}
