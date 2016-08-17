# leaflet-vector-tile

Este modulo permite crear un layer de leaflet que renderiza [vector tiles](https://github.com/mapbox/vector-tile-spec).

## Instalación

```
npm install --save git+ssh://git@bitbucket.org/csw-consultores-ambientales/leaflet-vector-tile.git
```

## Uso

```javascript
import L from 'leaflet';
import VectorTileLayer from 'leaflet-vector-tile';

let map = L.map('map');

let vectorTileOptions = {
  pane: 'overlayPane',
  getStyle: function(feature, zoom) {
    // canvas options
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
    let style = {
      lineWidth: 2,
      strokeStyle: '#55AAFF',
      fillStyle: 'rgba(0, 170, 255, 0.25)'
    };

    if (zoom > 10) {
      style.strokeStyle = '#AA5500';
    }
    return style;
  },
  onClick: function (feature, layer, e) {
    // Nota: feature.geometry es la geometria proyectada al
    // tile donde se hizo click y por tanto
    // no corresponde a las coordenadas reales.
    console.log(feature);
    console.log(layer);
    console.log(e);
  }
};

let url = 'http://tiles.map-server.cswlabs.cl/tiles/red_vial_1/{z}/{x}/{y}.pbf';
let vtLayer = new VectorTileLayer(url, vectorTileOptions);
vtLayer.addTo(map);


map.setView(L.latLng(-33.4, -70.6), 10);
```


## Otros modulos similares
 - https://github.com/devTristan/hoverboard (sólo tiene soporte para leaflet 0.7)
 - https://github.com/SpatialServer/Leaflet.MapboxVectorTile 
   (sólo tiene soporte para leaflet 0.7)
 - https://github.com/IvanSanchez/Leaflet.VectorGrid. (no tiene interactividad)

