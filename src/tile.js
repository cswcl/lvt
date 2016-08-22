'use strict';

function Tile(coords, tileSize, canvas) {
  if (canvas.width !== tileSize || canvas.height !== tileSize) {
    throw new Error(`canvas size must be ${tileSize}x${tileSize}`);
  }

  this._coords = coords;
  this._size = tileSize;
  this._canvas = canvas;
  this._ctx = this._canvas.getContext('2d');
  this._layers = {};
  this._currentStyle = null;
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

Tile.prototype.draw = function draw(getStyle) {
  for (let layerId in this._layers) {
    let layer = this._layers[layerId];
    let features = layer.features;

    for (let i = 0, n = features.length; i < n; i++) {
      let feature = features[i];
      let style = getStyle(feature, this._coords.z);

      if (this._beforeFeatureDraw) {
        this._beforeFeatureDraw(feature, style);
      }

      this._applyStyle(style);

      switch (feature.type) {
        case Tile.POINT:
          this._drawPoint(feature._parts);
          break;
        case Tile.LINESTRING:
          this._drawLinestring(feature._parts);
          break;
        case Tile.POLYGON:
          this._drawPolygon(feature._parts);
          break;
      }
    }
  }
};

Tile.prototype.prepareVTLayer = function prepareVTLayer(vtLayer, tileSize) {
  let features = [];
  let pxPerExtent = tileSize / vtLayer.extent;

  vtLayer.pxPerExtent = pxPerExtent;

  for (let i = 0; i < vtLayer.length; i++) {
    let feature = vtLayer.feature(i);
    feature.geometry = feature.loadGeometry();
    this._mkFeatureParts(feature, pxPerExtent);
    features.push(feature);
  }

  vtLayer.features = features;
};

Tile.prototype._applyStyle = function _applyStyle(style) {
  let ctx = this._ctx;

  if (style === this._currentStyle) {
    return;
  }

  for (let k in style) {
    if (ctx[k]) {
      ctx[k] = style[k];
    }
  }

  this._currentStyle = style;
};

Tile.prototype._drawPoint = function _drawPoint(geometry) {
  let parts = geometry,
      ctx = this._ctx,
      radius = 5;

  for (let i = 0, n = parts.length; i < n; i++) {
    let points = parts[i];
    for (let j = 0, m = points.length; j < m; j++) {
      let point = points[j];
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }
};

Tile.prototype._drawLinestring = function _drawLinestring(geometry) {
  let parts = geometry,
      ctx = this._ctx;

  for (let i = 0, n = parts.length; i < n; i++) {
    let points = parts[i];
    ctx.beginPath();
    for (let j = 0, m = points.length; j < m; j++) {
      let point = points[j];
      ctx[j ? 'lineTo' : 'moveTo'](point.x, point.y);
    }
    ctx.stroke();
  }
};

Tile.prototype._drawPolygon =  function _drawPolygon(geometry) {
  let parts = geometry,
      ctx = this._ctx;

  for (let i = 0, n = parts.length; i < n; i++) {
    let points = parts[i];
    ctx.beginPath();
    for (let j = 0, m = points.length; j < m; j++) {
      let point = points[j];
      ctx[j ? 'lineTo' : 'moveTo'](point.x, point.y);
    }
    ctx.fill();
    ctx.stroke();
  }
};

// Escala coordenadas de los vector tiles a coordenadas de tile.
Tile.prototype._mkFeatureParts = function _mkFeatureParts(feat, pxPerExtent) {
  let rings = feat.geometry;

  feat._parts = [];
  for (let i = 0, n = rings.length; i < n; i++) {
    let ring = rings[i];
    let part = [];

    for (let j = 0, m = ring.length; j < m; j++) {
      let coord = ring[j];
      part.push({x: coord.x * pxPerExtent, y: coord.y * pxPerExtent});
    }

    feat._parts.push(part);
  }
};

module.exports = Tile;
