import { Point, Route } from './elements.js';


export class Map extends L.Map{
  constructor() {
    super('map');
    // Default view
    this.setView([48.3904, -4.4861], 15);
    // Add OpenStreetMap tile layer
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 10,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this);

    // Add CyclOSM tile layer
    const cycleLayer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      maxZoom: 10,
      attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a>'
    });
    // Layer control
    const baseMaps = {
      "OpenStreetMap": osm,
      "Cycle Map": cycleLayer
    };
    L.control.layers(baseMaps).addTo(this);
    // List pour les paths
    this.paths = Array();
    this.pathIndex = -1; // la route actuelle

    this.addEventListener("contextmenu", this.handleContextMenu);    
  }
  getCurrentPath() {
    return this.paths[this.pathIndex];
  }
  removePath(route) {
		const index = this.paths.indexOf(route);
		if (index !== -1) {
		  this.paths.splice(index, 1);
		}
	}
  addPath(coord) {
    let route = new Route(coord, this);
    this.paths.push(route);
    this.pathIndex = this.paths.length - 1;
  }

  handleContextMenu(e) {
    e.originalEvent.preventDefault();

    // Pas de route multiple pour l'instant
    if (this.paths.length > 0){
      return
    }


    if (!e.originalEvent.target.classList.contains('marker')) {
      this.addPath([e.latlng.lat, e.latlng.lng]);
    }
  }
  remove() {
    // Nettoyage des routes
    this.paths.forEach(route => {
      route.remove()
    })
    this.paths = []
    this.pathIndex = -1
    // Suppression des événements
    this.removeEventListener("contextmenu", this.handleContextMenu);
    // Suppression de la carte
    super.remove();
    this.clearMapDiv();
  }
  clearMapDiv() {
    const newMapDiv = document.createElement('div');
    newMapDiv.id = 'map';
    const oldMapDiv = document.getElementById('map');
    if (oldMapDiv){
        oldMapDiv.parentNode.replaceChild(newMapDiv, oldMapDiv);
    }
  }
}
