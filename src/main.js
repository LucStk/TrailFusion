
import './index.css';
import './elements.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let mapInstance;

const { Map } = await import('./map.js');
mapInstance = new Map();

// Handle Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept('./map.js', (module) => {
    console.log('[HMR] Updating map module');
    mapInstance.remove();
    mapInstance = new module.Map();
  });
}

/*
let mapInstance;

async function loadMap() {
  const mod = await import('./map.js'); // 👈 force fresh reload
  console.log('[DEBUG] Reloaded Map module');

  if (mapInstance) {
    console.log('[DEBUG] Removing previous map instance...');
    mapInstance.remove();
  }

  mapInstance = new mod.default();
  window.map = mapInstance;
}

document.addEventListener('DOMContentLoaded', () => {
  loadMap();
});

if (import.meta.hot) {
  console.debug("new meta detected")
  import.meta.hot.accept((newModule) => {
    console.log('[HMR] Accept triggered');
    loadMap();
  });
}
*/
