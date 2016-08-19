# leaflet-vector-tile

Este modulo permite crear un layer de leaflet que renderiza [vector
tiles](https://github.com/mapbox/vector-tile-spec).

## Instalación

```
npm install --save git+ssh://git@bitbucket.org/csw-consultores-ambientales/leaflet-vector-tile.git#v0.1.0
```

## API
Creación de una capa vectorial

```javascript
let vtLayer = new VectorTileLayer(url, options)
```

El argumento `url` corresponde a la ubicación de los vector tiles en el
formato que indica la [especificación de mapbox vector
tile](https://github.com/mapbox/vector-tile-spec).

El argumento `options` es un objeto que puede recibir las mismas propiedades
que [leaflet GridLayer](http://leafletjs.com/reference-1.0.0.html#gridlayer).
Adicionalmente, se puede incluir el parametro `style` para indicar el estilo
con el que deben ser dibujados los vectores.

Un objeto de tipo `VectorTileLayer` tiene los siguientes métodos disponibles:

- **setStyle(style):**
  permite cambiar el estilo de los canvas. Esto no redibuja automaticamente los tiles.
- **reRender():**
  redibuja los tiles con el estilo actual.
- **query(latlng):**
  Recibe como argumento un objeto leaflet LatLng y retorna el feature que esta en esa ubicación.

## Ejemplo

```javascript
import L from 'leaflet';
import VectorTileLayer from 'leaflet-vector-tile';

let map = L.map('map');

let vectorTileOptions = {
  pane: 'overlayPane',
  style: function(feature, zoom) {
    // canvas options
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
    let style = {
      lineWidth: 2,
      strokeStyle: '#55AAFF',
      fillStyle: 'rgba(0, 170, 255, 0.25)'
    };

    if (zoom >= 10) {
      style.strokeStyle = '#AA5500';
    }
    return style;
  }
};

let url = 'http://tiles.map-server.cswlabs.cl/tiles/red_vial_1/{z}/{x}/{y}.pbf';
let vtLayer = new VectorTileLayer(url, vectorTileOptions);
vtLayer.addTo(map);

map.setView(L.latLng(-33.4, -70.6), 10);

map.on('click', function(e) {
  let feature = vtLayer.query(e.latlng);
  console.log(feature);
});
```

## Style

La opción `style` que se pasa al crear un `VectorTileLayer` soporta
dos tipos de valores posibles.  El primero es una función que recibe como
argumentos el `feature` y el `zoom` y retorna las
[propiedades](https://developer.mozilla.org/en-
US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors) que se deben
aplicar al contexto del canvas. La segunda opción es que `style` sea un objeto
json con la estructura que se menciona más adelante.

Ejemplo de función style:

```javascript
vectorTileOptions.style = function style(feature, zoom) {
  let st = {
    lineWidth: 2,
    strokeStyle: '#55AAFF',
    fillStyle: 'rgba(0, 170, 255, 0.25)'
  };

  if (zoom >= 10) {
    st.strokeStyle = '#AA5500';
  }
  return st;
}
```

Adicionalmente este módulo viene con parser de estilos en formato json. De
esta forma el ejemplo anterior se puede escribir de la siguiente forma.

```
vectorTileOptions.style = {
  lineWidth: 2,
  fillStyle: 'rgba(0, 170, 255, 0.25)',
  strokeStyle: {
    type: 'interval',
    stops: [[0, '#55AAFF'], [10, '#AA5500']]
  }
};
```

Este formato tiene la ventaja de poder almacenar y transmitir el estilo en
formato json. Además las opciones de interpolación permiten facilmente definir
estilos en una escala continua, por intervalos o por categorias.

Las `key` el objeto de estilo son las propiedades que se aplicarán al contexto
del canvas. Los values pueden ser los valores correspondientes a esas
propiedades o un objeto que tiene la definición de una función de
interpolación de la misma forma en como está definida en la [especificación
mapbox gl function](https://www.mapbox.com/mapbox-gl-style-spec/#types-
function).



## Changelog

**v0.1.0**:

  - (breaking change) cambia la opción `getStyle` por `style`.
  - Agrega método `setStyle` para cambiar el estilo.
  - Agrega método `reRender` para redibujar de nuevo los tiles.
  - Agrega soporte para definir estilos en formato json

**v0.0.1**:

  - version inicial

## Otros modulos similares
 - https://github.com/devTristan/hoverboard (sólo tiene soporte para leaflet 0.7)
 - https://github.com/SpatialServer/Leaflet.MapboxVectorTile
   (sólo tiene soporte para leaflet 0.7)
 - https://github.com/IvanSanchez/Leaflet.VectorGrid. (no tiene interactividad)

