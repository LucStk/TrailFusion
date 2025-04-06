export class Map extends L.Map{
  constructor() {

    super('map');
    this.setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this);
}

    remove() {
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