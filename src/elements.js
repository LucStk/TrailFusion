import L from 'leaflet';

export class Route{

	constructor(coordinates,map) {
		this.coordinates = coordinates;
		// Entrypoint est le point d'entrée de la chaîne
		// C'est un point au hasard de la liste
		this.entrypoint = new Point(coordinates,map);
		this.entrypoint.route = this;
	}

    remove() {
        // Supprimer tous les points
        if (this.entrypoint) {
			let n = this.entrypoint.next;
			let p = this.entrypoint.previous;
			this.entrypoint.remove();
            function rec_drop(point, direction) {
                if (!point) return;
                const nextPoint = direction ? point.next : point.previous;
                point.remove();
                rec_drop(nextPoint, direction);
            }
            
            rec_drop(n, true);
            rec_drop(p, false);
        }
        
        // Nettoyer les références
        this.entrypoint = null;
        this.coordinates = null;
        
        // Notifier la carte si nécessaire
        if (this.map) {
            // Émettre un événement de suppression de route
            this.map.fire('routeremoved', { route: this });
        } 
	}

	getFirstPoint(){
		function rec_first(point) {
			return point.previous ? rec_first(point.previous) : point
		}
		return rec_first(this.entrypoint);
	}

	getLastPoint(){
		function rec_last(point) {
			return point.next ? rec_first(point.next) : point
		}
		return rec_last(this.entrypoint);
	}

	invertAllPoints(){
		// Change de tous les points de la route

		function rec_inv_next(point) {
			if (!point) {return;}
			rec_inv_next(point.next);
			invertPoint(point);
		}
		rec_inv_next(this.getFirstPoint());
	}

	invertPoint(point){
		let prev = point.previous;
		point.previous = point.next;
		point.next = prev;
	}

	getLength(){
		let length = 0;
		let currentPoint = this.entrypoint;
		while (currentPoint) {
				length++;
				currentPoint = currentPoint.next;
		}
		currentPoint = this.entrypoint;
		while (currentPoint) {
			length++;
			currentPoint = currentPoint.previous;
		}
		return length;
	}
}

class Lines extends L.Polyline {

	constructor(coordinates,map) {
		// Créer une ligne
		super(coordinates, {
			color: 'blue',
			weight: 3,
			opacity: 0.7
		});
		
		this.colors = ['blue', 'red', 'green', 'purple', 'orange'];
		this.currentColorIndex = 0;
		this.point = null; // un segment est associé au point de départ
		this.map = map;
		this.addTo(map);

		this.on("dblclick", this.handledbClick);
		this.on("click", this.handleClick);
		this.on("contextmenu", this.handleContextMenu);
	}
	remove(){
        this.off("dblclick");
        this.off("click");
        this.off("contextmenu");

		super.remove();
		this.point = null;

	}

	nextColor() {
	  this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
	  return this.colors[this.currentColorIndex];
	}

	setColorPolyline(color) {this.setStyle({ color: color });}
	
	handledbClick(e) {
		L.DomEvent.stopPropagation(e);
	}

	handleClick(e) {
		 L.DomEvent.stopPropagation(e); // Empêche la propagation de l'événement
		 e.originalEvent.preventDefault();
		 const newColor = this.nextColor();
		 this.setColorPolyline(newColor);
	};

	handleContextMenu(e) {
		 L.DomEvent.stopPropagation(e); // Empêche la propagation de l'événement
		 e.originalEvent.preventDefault();

		 this.point.creatNext([e.latlng.lat, e.latlng.lng]);
		 this.point.next.beginDrag();
	}

}

export class Point extends L.Marker {
	constructor(latlng, map) {

		let options = {
			draggable: true,
			bubblingMouseEvents: true,
			icon: L.divIcon({
					className: 'custom-marker',
					html: `
						<div class="marker">
									<span class = "close">×</span>
									<!--<span class = "extend">+</span>-->
						</div>`,
					iconSize: [20, 20],
					iconAnchor: [11, 11]
			})
		}
		super(latlng, options);
		this.map = map;

		this.addTo(map);

		this.route    = null; // la route associée
		this.next = null; // point suivant pour la chained list
		this.previous  = null; // point precedent pour la chained list
		this.segment    = null; // segment du point au point suivant

		this.getElement().objet = this; // Référence à l'objet Point dans le DOM

		console.log(this.getElement());

		// Création d'un nouveauPoint lié
		this.on("contextmenu", this.NewLinkPoint);

		// Coucou
		this.on("click", this.handleClick);

		// Update les segments des deux côtés du point
		this.on("move", e => {
			this.updateSegment();
			if (this.previous) {this.previous.updateSegment();}
		});
		//this.on("dragstart", this.watchForFuse);
		//this.on("onmouseover", this.handleDragStart);
	}
	remove() {
		// Supprimer le marqueur graphiquement
		this.off("contextmenu");
        this.off("click");
        this.off("move");
        	
		super.remove();
		// Nettoyer le segment
		if (this.segment) {
			this.segment.remove();
			this.segment = null;
		}
		
		// Mettre à jour les liaisons
		if (this.previous) {
			this.previous.next = this.next;
			this.previous.updateSegment();
		}
		if (this.next) {
			this.next.previous = this.previous;
		}

		// Nettoyer les références
		this.next = null;
		this.previous = null;
		this.route = null;
		this.map = null;
	}

	drop(){
		this.remove()
        if (this.route && this.route.entrypoint === this) {
            if (this.next) {
                this.route.entrypoint = this.next;
            } else if (this.previous) {
                this.route.entrypoint = this.previous;
            } else {
                // La route est vide
				this.remove()
                this.route.remove();
            }
        }
		
	}

	watchForFuse(e) {
		let MouseMove = e => {
			this.setCoord([e.latlng.lat, e.latlng.lng]);
	
			// Détecter les éléments sous le curseur
			const elementsUnderCursor = document.elementsFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
			elementsUnderCursor.forEach(el => {
				if (el.classList.contains('marker')) {
					const point = el.objet;
					if (point !== this) {
						// Si le point est différent de celui-ci, on le fusionne
						this.handleFuse(e);
					}
				}
			});
		};
	
		const endDrag = (e) => {
			e.originalEvent.preventDefault();
			this.map.removeEventListener("mousemove", MouseMove);// Réactiver les événements
		};
	// Désactiver les événements
		this.map.addEventListener("mousemove", MouseMove);
		this.map.once("mouseup", endDrag);
	}

	setCoord(coord) { this.setLatLng(coord); }
	getCoord() { return this.getLatLng(); }
	getLat() { return this.getLatLng().lat; }
	getLng() { return this.getLatLng().lng; }

	creatSegment(){
		this.segment = new Lines([this.getCoord(), this.next.getCoord()], this.map);
		this.segment.point = this;
	}

	updateSegment(){
		// Met à jour le segment entre ce point et le suivant
		if (this.next) {
			// Si le segment existe déjà, on le met à jour
			if (this.segment) {
				this.segment.setLatLngs([this.getCoord(), this.next.getCoord()]);
				this.segment.redraw();
				return;
			}
			// Sinon on le crée
			this.creatSegment();
			return
		}
		// Pas de suivant, pas de raison d'avoir un segment
		if (this.segment) {this.segment.remove();}
	}

	setNext(next) {
		// Met à jour le point avec le point suivant
		this.next = next;
		if (this.next) {
			this.next.previous = this;
		}
		this.updateSegment();
	}

	creatNext(coord){
		// Créer un point suivant à partir de celui-ci
		let newPoint = new Point(coord, this.map);
		newPoint.route = this.route;
		// Si le point suivant existe on le relie à lui
		if (this.next) {	
			newPoint.setNext(this.next); // On met le suivant du nouveau point
		}
		this.setNext(newPoint); // On met le suivant du point actuel
	}

	fuse(point){
		// Fusionne ce point avec le point celui donné en paramètre
		// Le point est toujours celui qui donne la direction

		if (this.previous  && this.next ) {return;}
		if (point.previous && point.next) {return;}
		if (!point.previous && !point.next) {return;}
		
		let sens_Next = True;

		if (!this.previous && !point.next){
			point.setNext(this); 
			sens_Next = false;

		} else if (!this.next && !point.previous){
			this.setNext(point);

		}else if (!this.previous){ 
			point.route.invertAllPoints()
			point.setNext(this);
			sens_Next = false;

		}else if (!this.next){ 
			point.route.invertAllPoints()
			this.setNext(point);

		
		}else {console.error("Error : Impossible de fusionner les points {} et {}", this, point)}

		point.remove();

		//On supprime les doublons de routes
		function rec_chg(point, sens_next) {
			if (!point) {return;}
			point.route = this.route;
			if (sens_next) {rec_chg(point.next);}
			else {rec_chg(point.previous);}
		}
		rec_chg(this, sens_Next);
	}


	handleFuse(e) {
		// Si les deux points sont trop proches, on les fusionne
		e.originalEvent.preventDefault();
		this.remove();
	}

	handleClick(e) {
		// Empêcher la propagation si on clic sur la croix
		if (e.originalEvent.target.classList.contains('close')) {
			this.drop();
		}
	}
	NewLinkPoint(e) {
		//Si drag, alors on créé un point suivant lié à celui-ci et on le pose à 
		//l'endroit où le clic est relevé
		e.originalEvent.preventDefault();

		// Seulement si on est à la fin de la route
		if (this.previous && this.next) {return;}

		this.creatNext([e.latlng.lat, e.latlng.lng]);
		// On le drag
		if (this.previous === null) {
			this.beginDrag();
		}else{
			this.next.beginDrag();
		}
	}

	beginDrag(){
		let MouseMove = e => {this.setCoord([e.latlng.lat, e.latlng.lng]);}

		const endDrag = (e) => {
			e.originalEvent.preventDefault();
			this.map.removeEventListener("mousemove", MouseMove);
		}
		this.map.addEventListener("mousemove", MouseMove);
		this.map.once("mouseup", endDrag);
	}

	handlePointMove() {
		this.updateSegment();
		if (this.previous) {this.previous.updateSegment();}
	}
	handlePointMoveEnd() {
		console.log("Point moved");
	}

	handleDragStart(e) {
		// On empêche la propagation de l'événement
		if (e.originalEvent) {
			e = e.originalEvent;
		}	
		e.dataTransfer.setData('text/plain', "custom-data");
	}

	handleDragEnd(e) {
		//e.preventDefault();
		const x = e.clientX;
		const y = e.clientY;
	  
		// Use elementsFromPoint to get all elements at that position
		const elementsUnderCursor = document.elementsFromPoint(x, y);
		console.log("Elements under cursor:", elementsUnderCursor);

	}
	handleremove(e) { 
		if (e.dataTransfer) {
			const data = e.dataTransfer.getData('text/plain');
			console.log("remove data:", data);
		} else {
			console.log("dataTransfer non disponible");
		}
	}
};
