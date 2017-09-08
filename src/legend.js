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
    let ctx = canvas.getContext('2d'),
        hw = canvas.width / 2,
        hh = canvas.height / 2,
        radius = Math.min(hw, hh) - pad;

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
    let ctx = canvas.getContext('2d'),
        w = canvas.width,
        h = canvas.height;

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
    let ctx = canvas.getContext('2d'),
        w = canvas.width,
        h = canvas.height;

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
  let fakeFeature = {properties: symbol.data},
      zoom = symbol.data.zoom || 0,
      style = styleFn(fakeFeature, zoom),
      canvas = document.createElement('canvas');

  canvas.width = 24;
  canvas.height = 24;

  drawer[symbol.geom](canvas, style);
  return canvas.toDataURL();
}

function createTitleFromSymbolData(data) {
  let conditions = [];

  for (let k in data) {
    conditions.push(data[k]);
  }

  return conditions.join('&');
}


function createSymbolsFromStyle(styleDef, geom) {
  let variants = {
    zoom: []
  };

  // Buscar propiedades que tienen definición de tipo mapbox-gl-function
  let functionProperties = Object.keys(styleDef)
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
    let value = styleDef[key];
    let property = value.property;

    if (property && !variants[property]) {
      variants[property] = [];
    }

    value.stops.forEach(function(stop) {
      let propValue = stop[0];

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
  let keys = Object.keys(variants).filter((k) => variants[k].length);
  let allValues = keys.map((k) => variants[k]);

  return util.cartesianProduct(allValues)
    .map(function(values) {
      let data = util.zipObject(keys, values);
      let symbol = {
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
