'use strict';

const glfun = require('mapbox-gl-function');
const parseColorString = require('csscolorparser').parseCSSColor;

/*
  Style: {
    <key>: <value>,
    ...
  }

  key: strokeStyle || fillStyle || lineWidth

  // el tipo de <value> depende de <key>.
  // Pero todos los <key> aceptan adicionalmente el tipo <function>
  value: <number> || <color> || <mapbox-gl-function>

  mapbox-gl-function: ver https://www.mapbox.com/mapbox-gl-style-spec/#types-function

  Ejemplo:

  let myStyle = {
    lineWidth: 2,
    strokeStyle: {
      stops: [
        [0, '#55AAFF'],
        [10, '#AA5500']
      ]
    }
  }

*/

let defaultStyle = {};

function parseStyle(style) {
  style = Object.assign({}, defaultStyle, style);

  let functionProperties = Object.keys(style)
    .filter((key) => typeof style[key] === 'object');


  if (!functionProperties.length) {
    return () => style;
  }

  functionProperties.forEach(function(key) {
    let value = style[key];
    // glfun no soporta colores en type exponential,
    // se deben convertir primero a un array de numeros
    value.stops = value.stops.map(function(stop) {
      if (typeof stop[1] !== 'string') {
        return stop;
      }

      return [stop[0], parseColorString(stop[1]) || stop[1]];
    });

    style[key] = glfun.interpolated(value);
  });

  return function(zoom, properties) {
    let res = Object.assign({}, style);

    functionProperties.forEach(function(key) {
      res[key] = style[key](zoom, properties);
      if (Array.isArray(res[key])) {
        res[key] = 'rgba(' + res[key].map((num) => Math.round(num)).join(',') + ')';
      }
    });

    return res;
  };
}

module.exports = {
  parseStyle
};


