'use strict';

const glfun = require('mapbox-gl-function');
const parseColorString = require('csscolorparser').parseCSSColor;

const MAP_STYLE_PROPS_TO_CANVAS_PROPS = {
  //'marker': no se aplica al contexto
  //'marker-size': no se aplica al contexto
  //'line': no se aplica al contexto
  'line-width': 'lineWidth',
  'line-color': 'strokeStyle',
  'line-cap': 'lineCap',
  'line-join': 'lineJoin',
  //'fill': no se aplica al contexto,
  'fill-color': 'fillStyle'
};

const defaultStyle = {
  'marker': 'circle',
  'marker-size': 10,
  'line': true,
  'line-width': 1,
  'line-color': '#000',
  'line-cap': 'round',
  'line-join': 'round',
  'fill': true,
  'fill-color': '#00f'
};

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
    return `rgba(${  value.map((num) => Math.round(num)).join(',')  })`;
  }

  return value;
}

function parseStyle(styleDef) {
  styleDef = JSON.parse(JSON.stringify(styleDef || {}));
  styleDef = Object.assign({}, defaultStyle, styleDef);

  // Buscar propiedades que tienen definición de tipo mapbox-gl-function
  const functionProperties = Object.keys(styleDef)
    .filter((key) => typeof styleDef[key] === 'object');

  // Si todas las propiedades son constantes retornar una función que retorna
  // el mismo estilo pasado como argumento
  if (!functionProperties.length) {
    return () => styleDef;
  }

  // Cada una de los valores definidos como mapbox-gl-function se deben transformar
  // a una función de interpolación. Pero para que los colores funcionen correctamente
  // con la función de interpolación, se deben transformar a arreglos de numeros.
  functionProperties.forEach(function(key) {
    const value = styleDef[key];
    prepareInterpolatedValue(value);
    styleDef[key] = glfun.interpolated(value);
  });


  return function(feature, zoom) {
    const res = Object.assign({}, styleDef);
    const properties = feature.properties;

    functionProperties.forEach(function(key) {
      const value = styleDef[key](zoom, properties);
      res[key] = convertInterpolatedValue(value);
    });

    return res;
  };
}

function applyStyle(style, context) {
  if (context._current_style === style) {
    return;
  }

  const keys = Object.keys(MAP_STYLE_PROPS_TO_CANVAS_PROPS);

  keys.forEach(function(key) {
    if (typeof style[key] !== 'undefined') {
      const canvasProp = MAP_STYLE_PROPS_TO_CANVAS_PROPS[key];
      context[canvasProp] = style[key];
    }
  });

  context._current_style = style;
}

module.exports = {
  defaultStyle,
  parseStyle,
  applyStyle
};
