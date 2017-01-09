# leaflet-vector-tile

Este modulo permite crear un layer de leaflet que renderiza [vector
tiles](https://github.com/mapbox/vector-tile-spec).

## Instalación

```
npm install --save git+ssh://git@bitbucket.org/csw-consultores-ambientales/leaflet-vector-tile.git#v0.2.4
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
  permite cambiar el estilo con el que se dibujan los vectores. Si ya hay tiles
  dibujados, son redibujados automaticamente.
- **getStyle():**
  obtiene el estilo utilizado en la capa.
- **getStyleFn():**
  obtiene la función generadora de estilos. La función que retorna recibe como argumentos
  un feature y un zoom y retorna un estilo con las funciones de interpolación resultas a
  valores concretos.
- **reRender():**
  redibuja los tiles con el estilo actual.
- **query(latlng):**
  Recibe como argumento un objeto leaflet LatLng y retorna el feature que esta en esa ubicación.
- **setFilter(fn):**
  Define una función para filtrar features. Sólo los features que pasen el filtro serán
  renderizados. La función de filtrado recibe como argumento el feature.

## Ejemplo

```javascript
import L from 'leaflet';
import VectorTileLayer from 'leaflet-vector-tile';

let map = L.map('map');

let vectorTileOptions = {
  pane: 'overlayPane',
  style: {
    'line-width': 2,
    'line-color': '#55AAFF',
    'fill-color': 'rgba(0, 170, 255, 0.25)'
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

La opción `style` que se pasa al crear un `VectorTileLayer` es un objeto donde
las keys representan distintas opciones de renderizado. Dependiendo de la geometría
a dibujar, el renderizado ocupa unas u otras propiedades.

Propiedades disponibles:

| Propiedad     | Default        | Descripción                                              |
| ------------- | -------------- | ---------------------------------------------------------|
| marker        | 'circle'       | Tipo de marcador a usar. El único valor posible por ahora es circle.
| marker-size   | 10             | Tamaño del marcador. El numero indicado, representa el ancho y el alto del marcador.
| line          | true           | Define si se debe dibujar las lineas.
| line-width    | 1              | Tamaño de la lineas en pixels.
| line-color    | '#000'         | Color de la lineas. Se puede usar cualquier formato usado por canvas como rgb() o rgba().
| line-cap      | 'round'        | Define la [forma](https://developer.mozilla.org/es/docs/Web/API/CanvasRenderingContext2D/lineCap) de terminación de la lineas.
| line-join     | 'round'        | Defina la [forma](https://developer.mozilla.org/es/docs/Web/API/CanvasRenderingContext2D/lineJoin) de las esquinas de las lineas
| fill          | true           | Define si se debe dibujar el relleno de las figuras.
| fill-color    | '#00f'         | Define el color de relleno. Se puede usar cualquier formato usado por canvas como rgb() o rgba().


Por ejemplo:

```
vectorTileOptions.style = {
  'line-width': 2,
  'line-color': '#55AAFF',
  'fill-color': 'rgba(0, 170, 255, 0.25)'
};
```

Adicionalmente cada propiedad puede aceptar un objeto como valor que define una
función de interpolación de la misma forma en como está definida en la
[especificación de mapbox gl function](https://www.mapbox.com/mapbox-gl-style-spec/#types-
function).

Por ejemplo:
```
vectorTileOptions.style = {
  'line-width': 2,
  'fill-color': 'rgba(0, 170, 255, 0.25)',
  'line-color': {
    type: 'interval',
    stops: [[0, '#55AAFF'], [10, '#AA5500']]
  }
};
```

## Legend

Este proyecto incluye un modulo para la generación y renderizado de simbolos de leyenda.
El modulo se encuentra en `src/legend` y se puede acceder mediante;

```
const legend = require('leaflet-vector-tile/lib/legend');

```

Un simbolo es un objeto que define las propiedades necesarias para dibujar un simbolo más
un titulo. La propiedad geom, indica que icono se debe dibujar, puede ser `point`, `line`
o `polygon`. La propiedad data es objeto con propiedades que terminaran las caracteristicas
del icono. El funcionamiento es el siguiente, con todas las propiedades de data, excepto zoom,
se construye un feature. Luego con ese feature y el zoom se puede obtener un estilo con el que
finalmente se dibujará el icono.

```
let symbol = {
  title: 'foo',
  geom: 'line', //valid: 'point', 'line', 'polygon'
  data: {
    zoom: 15,
    foo: 'bar',
    buz: 'lol'
  }
}
```


`legend` pone a disposición dos metodos:

  - **createSymbolsFromStyle(style, geom):**
    Esta función recibe como argumento un estilo y tipo de geometria(`point`, `line`, `polygon`)
    y retorna un arreglo con objetos symbolos representativos del estilo.

  - **drawSymbol(styleFn, symbol):**
    Esta función recibe como argumento una función generadora de estilos, como la retornada
    por `VectorTileLayer.getStyleFn` y un objeto que define un simbolo y retorna un canvas
    con el simbolo dibujado.


## Changelog

**master**

 - (breaking change) se renombra función de filtrado `filter` a `setFilter`.

**0.2.4**

  - agrega función de filtrado

**0.2.3**

  - corrige error en llamada a callback para dar soporte a leaflet 1.0.1

**0.2.2**

  - Corrige función query para linestring.

**0.2.1**

  - Agrega función `getStyleFn` para obtener la función generadora de estilos.

**0.2.0**

  - (breaking change) Se renombra y limita las propiedades posibles en el estilo.
  - (breaking change) `setStyle` redibuja automaticamente los tiles con el nuevo estilo.
  - Agrega metodo `getStyle` para obtener el estilo de la capa.
  - (breaking change) la opción style ya no soporta una función como valor posible.
    La razón de esto, es que la generación de leyenda sólo está disponible para
    definición de estilo en formato json.
  - Define estilo por defecto simple en `style.js`

**v0.1.3**

  - agrega funcionalidad para generar y dibujar leyendas
  - (fix) reRender borra los tiles antes de redibujarlos

**v0.1.2**:

  - Sirve los archivos compilados a es5.

**v0.1.1**:

  - Refactoriza libreria.

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

