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

// value es de tipo mapbox-gl-function
function prepareInterpolatedValue(value) {
  if (!value.type || value.type === 'exponential') {
    value.stops = value.stops.map(function(stop) {
      if (typeof stop[1] !== 'string') {
        return stop;
      }

      return [stop[0], parseColorString(stop[1]) || stop[1]];
    });
  }
}

// value es resultado de la interpolación para una propiedad
function convertInterpolatedValue(value) {
  if (Array.isArray(value)) {
    return 'rgba(' + value.map((num) => Math.round(num)).join(',') + ')';
  }

  return value;
}

function parseStyle(style) {
  style = Object.assign({}, defaultStyle, style);

  // Buscar propiedades que tienen definición de tipo mapbox-gl-function
  let functionProperties = Object.keys(style)
    .filter((key) => typeof style[key] === 'object');

  // Si todas las propiedades son constantes retornar una función que retorna
  // el mismo estilo pasado como argumento
  if (!functionProperties.length) {
    return () => style;
  }

  // Cada una de los valores definidos como mapbox-gl-function se deben transformar
  // a una función de interpolación. Pero para que los colores funcionen correctamente
  // con la función de interpolación, se deben transformar a arreglos de numeros.
  functionProperties.forEach(function(key) {
    let value = style[key];
    prepareInterpolatedValue(value);
    style[key] = glfun.interpolated(value);
  });


  return function(feature, zoom) {
    let res = Object.assign({}, style);
    let properties = feature.properties;

    functionProperties.forEach(function(key) {
      let value = style[key](zoom, properties);
      res[key] = convertInterpolatedValue(value);
    });

    return res;
  };
}

module.exports = {
  parseStyle
};


