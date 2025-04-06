import './index.css'
import './elements.css'
import 'vite/modulepreload-polyfill';

import {Map} from './map.jsx'

export const map = new Map();

console.a = 10;

if (import.meta.hot) {
  console.a = 100
    // Surveillance de map.jsx
    import.meta.hot.accept('./map.jsx', (newModule) => {
      console.log("asen")
      if (newModule) {
        map.remove()
        const newMap = new newModule.Map()
        window.map = newMap
      }
    })
  
    // Surveillance de elements.jsx
    import.meta.hot.accept('./elements.jsx', (newModule) => {
      if (newModule) {
        // Recréer la carte pour appliquer les changements des éléments
        const oldMap = map
        oldMap.remove()
        const newMap = new Map()
        window.map = newMap
        
        // Transférer l'état si nécessaire
        /*
        if (oldMap.paths.length > 0) {
          oldMap.paths.forEach(path => {
            newMap.addPath(path.getFirstCoord())
          })
        }*/
      }
    })
  }
