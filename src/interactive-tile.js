'use strict';
/*globals document */

const L = require('leaflet');
const Tile = require('./tile');
const util = require('./util');

function InteractiveTile(coords, tileSize) {
  const canvas = document.createElement('canvas');

  canvas.width = tileSize;
  canvas.height = tileSize;

  Tile.call(this, coords, tileSize, canvas);
}

InteractiveTile.prototype = Object.create(Tile.prototype);

InteractiveTile.prototype.getContainer = function getContainer() {
  return this._canvas;
};

InteractiveTile.prototype.query = function query(p) {
  for (let layerId in this._layers) {
    const layer = this._layers[layerId];
    const features = layer.features;

    for (let i = 0, n = features.length; i < n; i++) {
      const feature = features[i];
      let containsPoint = false;

      switch (feature.type) {
        case Tile.POINT:
          containsPoint = this._pointNearsPoint(feature, p);
          break;
        case Tile.LINESTRING:
          containsPoint = this._linestringContainsPoint(feature, p);
          break;
        case Tile.POLYGON:
          containsPoint = this._PolygonContainsPoint(feature, p);
          break;
      }

      if (containsPoint) {
        // TODO: devolver todos los features cercanos
        return feature;
      }
    }
  }
};

InteractiveTile.prototype._beforeFeatureDraw = function _beforeFeatureDraw(feature, style) {
  feature.clickTolerance = this._calculeClickTolerance(feature, style);
};

InteractiveTile.prototype._calculeClickTolerance = function _calculeClickTolerance(feature, style) {
  const touchTolerance = (L.Browser.touch ? 10 : 2);

  if (feature.type === Tile.POINT) {
    // TODO: considerar que los marcadores despues incluiraran otras formas ademas de circulo
    const markerRadius = style['marker-size'] / 2;
    return markerRadius + touchTolerance;
  }

  if (style['line-width'] > 0) {
    return style['line-width'] / 2 + touchTolerance;
  }
};

InteractiveTile.prototype._linestringContainsPoint = function _linestringContainsPoint(linestring, p, closed) {
  let i;
  let j;
  let k;
  let len;
  let len2;
  let part;
  let w = linestring.clickTolerance;

  // TODO: optimize
  // if (!linestring._pxBounds.contains(p)) { return false; }

  // hit detection for polylines
  for (i = 0, len = linestring._parts.length; i < len; i++) {
    part = linestring._parts[i];

    for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
      if (!closed && (j === 0)) { continue; }

      if (util.pointToSegmentDistance(p, part[k], part[j]) <= w) {
        return true;
      }
    }
  }

  return false;
};

InteractiveTile.prototype._PolygonContainsPoint = function _PolygonContainsPoint(polygon, p) {
  let inside = false;
  let part;
  let p1;
  let p2;
  let i;
  let j;
  let k;
  let len;
  let len2;

  // TODO: optimize
  // if (!polygon._pxBounds.contains(p)) { return false; }

  // ray casting algorithm for detecting if point is in polygon
  for (i = 0, len = polygon._parts.length; i < len; i++) {
    part = polygon._parts[i];

    for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
      p1 = part[j];
      p2 = part[k];

      if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
        inside = !inside;
      }
    }
  }

  // also check if it's on polygon stroke
  return inside || this._linestringContainsPoint(polygon, p, true);
};

InteractiveTile.prototype._pointNearsPoint = function _pointNearsPoint(point, p) {
  let i;
  let j;
  let len;
  let len2;
  let part;
  let w = point.clickTolerance;

  for (i = 0, len = point._parts.length; i < len; i++) {
    part = point._parts[i];

    for (j = 0, len2 = part.length; j < len2; j++) {
      if (util.distance(part[j], p) <= w) {
        return true;
      }
    }
  }

  return false;
};

module.exports = InteractiveTile;
