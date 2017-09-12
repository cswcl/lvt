'use strict';

const applyStyle = require('./style').applyStyle;

function Tile(coords, tileSize, canvas) {
  if (canvas.width !== tileSize || canvas.height !== tileSize) {
    throw new Error(`canvas size must be ${tileSize}x${tileSize}`);
  }

  this._coords = coords;
  this._size = tileSize;
  this._canvas = canvas;
  this._ctx = this._canvas.getContext('2d');
  this._layers = {};
}

Tile.POINT = 1;
Tile.LINESTRING = 2;
Tile.POLYGON = 3;

Tile.prototype.addVTLayer = function addVTLayer(layer) {
  if (!layer.features) {
    this.prepareVTLayer(layer, this._size);
  }

  this._layers[layer.name] = layer;
};

Tile.prototype.draw = function draw(styleFn, clean) {
  if (clean) {
    this._ctx.clearRect(0, 0, this._size, this._size);
  }

  for (let layerId in this._layers) {
    const layer = this._layers[layerId];
    let features = layer.features;
    features = features.filter(this.filter);

    for (let i = 0, n = features.length; i < n; i++) {
      const feature = features[i];
      const style = styleFn(feature, this._coords.z);

      if (this._beforeFeatureDraw) {
        this._beforeFeatureDraw(feature, style);
      }

      applyStyle(style, this._ctx);

      switch (feature.type) {
        case Tile.POINT:
          this._drawPoint(feature._parts, style);
          break;
        case Tile.LINESTRING:
          this._drawLinestring(feature._parts, style);
          break;
        case Tile.POLYGON:
          this._drawPolygon(feature._parts, style);
          break;
      }
    }
  }
};

// by default render all
Tile.prototype.filter = function() {
  return true;
};

Tile.prototype.prepareVTLayer = function prepareVTLayer(vtLayer, tileSize) {
  const features = [];
  const pxPerExtent = tileSize / vtLayer.extent;

  vtLayer.pxPerExtent = pxPerExtent;

  for (let i = 0; i < vtLayer.length; i++) {
    const feature = vtLayer.feature(i);
    feature.geometry = feature.loadGeometry();
    this._mkFeatureParts(feature, pxPerExtent);
    features.push(feature);
  }

  vtLayer.features = features;
};

Tile.prototype._drawPoint = function _drawPoint(geometry, style) {
  const parts = geometry;
  const ctx = this._ctx;
  const radius = style['marker-size'] / 2;

  if (style.marker !== 'circle') {
    return;
  }

  for (let i = 0, n = parts.length; i < n; i++) {
    const points = parts[i];
    for (let j = 0, m = points.length; j < m; j++) {
      const point = points[j];
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      style.fill && ctx.fill();
      style.line && ctx.stroke();
    }
  }
};

Tile.prototype._drawLinestring = function _drawLinestring(geometry, style) {
  let parts = geometry;
  let ctx = this._ctx;

  if (!style.line) {
    return;
  }

  for (let i = 0, n = parts.length; i < n; i++) {
    const points = parts[i];
    ctx.beginPath();
    for (let j = 0, m = points.length; j < m; j++) {
      const point = points[j];
      ctx[j ? 'lineTo' : 'moveTo'](point.x, point.y);
    }
    ctx.stroke();
  }
};

Tile.prototype._drawPolygon =  function _drawPolygon(geometry, style) {
  const parts = geometry;
  const ctx = this._ctx;

  if (!style.line && !style.fill) {
    return;
  }

  for (let i = 0, n = parts.length; i < n; i++) {
    const points = parts[i];
    ctx.beginPath();
    for (let j = 0, m = points.length; j < m; j++) {
      const point = points[j];
      ctx[j ? 'lineTo' : 'moveTo'](point.x, point.y);
    }
    style.fill && ctx.fill();
    style.line && ctx.stroke();
  }
};

// Escala coordenadas de los vector tiles a coordenadas de tile.
Tile.prototype._mkFeatureParts = function _mkFeatureParts(feat, pxPerExtent) {
  const rings = feat.geometry;

  feat._parts = [];
  for (let i = 0, n = rings.length; i < n; i++) {
    const ring = rings[i];
    const part = [];

    for (let j = 0, m = ring.length; j < m; j++) {
      const coord = ring[j];
      part.push({x: coord.x * pxPerExtent, y: coord.y * pxPerExtent});
    }

    feat._parts.push(part);
  }
};

module.exports = Tile;
