'use strict';
/* global document */

const util = require('./util');
const applyStyle = require('./style').applyStyle;
const pad = 4;

/* symbol {
  title: 'foo',
  geom: 'line', //valid: 'point', 'line', 'polygon', 'multipoint', 'multiline', 'multilinestring', 'multipolygon'
  data: {
    zoom: 15,
    foo: 'bar',
    buz: 'lol'
  }
}
*/

let drawer = {
  point: function(canvas, style) {
    const ctx = canvas.getContext('2d');
    const hw = canvas.width / 2;
    const hh = canvas.height / 2;
    const radius = Math.min(hw, hh) - pad;

    applyStyle(style, ctx);
    ctx.beginPath();
    ctx.arc(hw, hh, radius, 2 * Math.PI, false);
    style.fill && ctx.fill();
    style.line && ctx.stroke();

    return canvas;
  },
  multipoint: function(canvas, style) {
    drawer['point'](canvas, style);
  },

  line: function(canvas, style) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    applyStyle(style, ctx);

    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, pad);
    style.line && ctx.stroke();

    return canvas;
  },
  multiline: function(canvas, style) {
    drawer['line'](canvas, style);
  },
  multilinestring: function(canvas, style) {
    drawer['line'](canvas, style);
  },

  polygon: function(canvas, style) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    applyStyle(style, ctx);

    ctx.beginPath();
    ctx.rect(pad, pad, w - 2 * pad, h - 2 * pad);
    style.fill && ctx.fill();
    style.line && ctx.stroke();

    return canvas;
  },
  multipolygon: function(canvas, style) {
    drawer['polygon'](canvas, style);
  }
};


function drawSymbol(styleFn, symbol) {
  const fakeFeature = {properties: symbol.data};
  const zoom = symbol.data.zoom || 0;
  const style = styleFn(fakeFeature, zoom);
  const canvas = document.createElement('canvas');

  canvas.width = 24;
  canvas.height = 24;

  drawer[symbol.geom](canvas, style);
  return canvas.toDataURL();
}

function createTitleFromSymbolData(data) {
  const conditions = [];

  for (let k in data) {
    conditions.push(data[k]);
  }

  return conditions.join('&');
}


function createSymbolsFromStyle(styleDef, geom) {
  const variants = {
    zoom: []
  };

  // Buscar propiedades que tienen definición de tipo mapbox-gl-function
  const functionProperties = Object.keys(styleDef)
    .filter((key) => typeof styleDef[key] === 'object');

  // Si todas las propiedades son constantes, el estilo no depende del feature
  if (!functionProperties.length) {
    return [{
      title: 'single symbol',
      geom: geom,
      data: {}
    }];
  }

  // Para cada uno de los valores definidos como mapbox-gl-function se debe
  // obtener un conjunto de valores de muestra
  functionProperties.forEach(function(key) {
    const value = styleDef[key];
    const property = value.property;

    if (property && !variants[property]) {
      variants[property] = [];
    }

    value.stops.forEach(function(stop) {
      const propValue = stop[0];

      if (!property) {
        variants.zoom.push(propValue);
      } else if (typeof propValue === 'object') {
        variants.zoom.push(propValue.zoom);
        variants[property].push(propValue.value);
      } else {
        variants[property].push(propValue);
      }
    });
  });

  // ordenar y eliminar duplicados desde las muestras
  for (let k in variants) {
    util.unique(util.sort(variants[k]));
  }

  // ahora con las muestras se debe construir todas las combinaciones posibles
  const keys = Object.keys(variants).filter((k) => variants[k].length);
  const allValues = keys.map((k) => variants[k]);

  return util.cartesianProduct(allValues)
    .map(function(values) {
      const data = util.zipObject(keys, values);
      const symbol = {
        title: createTitleFromSymbolData(data),
        geom: geom,
        data: data
      };
      return symbol;
    });
}




module.exports = {
  createSymbolsFromStyle,
  drawSymbol
};
