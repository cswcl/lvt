'use strict';
/* globals fetch, FileReader */

const Pbf = require('pbf');
const vectorTile = require('@mapbox/vector-tile');
const L = require('leaflet');
const InteractiveTile = require('./interactive-tile');
const parseStyle = require('./style').parseStyle;


const VectorTileLayer = L.GridLayer.extend({
  options: {
    subdomains: 'abc'  // Like L.TileLayer
  },


  initialize: function(url, options) {
    const noReRender = false;
    L.GridLayer.prototype.initialize.call(this, options);
    this._url = url;
    this._filter = () => true;
    this.setStyle(options.style || {}, noReRender);
  },

  createTile: function(coords, done) {
    const tile = new InteractiveTile(coords, this.getTileSize().x); // this assumes square tiles
    const vectorTilePromise = this._getVectorTilePromise(coords);
    const styleFn = this._styleFn;

    // set filter
    tile.filter = (feature) => this._filter(feature);

    vectorTilePromise.then(function renderTile(vectorTile) {
      for (let layerId in vectorTile.layers) {
        let layer = vectorTile.layers[layerId];
        tile.addVTLayer(layer);
      }

      tile.draw(styleFn);
      L.Util.requestAnimFrame(() => done());
    });

    const canvas = tile.getContainer();
    // save reference to interactiveTile.
    canvas._interactiveTile = tile;

    return canvas;
  },

  query: function (latLng) {
    const point = this._map.project(latLng);
    const tileSize = this.getTileSize().x;  // this assumes square tiles
    const tileXY = point.divideBy(tileSize).floor();
    const xy = point.subtract(tileXY.multiplyBy(tileSize));
    const zoom = this._map.getZoom();
    const tileKey = this._tileCoordsToKey({x: tileXY.x, y: tileXY.y, z: zoom});
    const tile = this._tiles[tileKey];

    if (tile) {
      const interactiveTile = this._getInteractiveTile(tile);
      const vtFeature = interactiveTile.query({x: xy.x, y: xy.y});

      if (!vtFeature) {
        return null;
      }

      const feature = vtFeature.toGeoJSON(tileXY.x, tileXY.y, zoom);

      // remove feature.id because is internaly. And we don't know what property is used as id
      delete feature.id;

      return feature;
    }
  },

  setStyle: function(styleDef, reRender = true) {
    if (typeof styleDef !== 'object') {
      throw new Error('style must be an object');
    }

    this._styleDef = styleDef;
    this._styleFn = parseStyle(styleDef);

    if (reRender) {
      this.reRender();
    }
  },

  getStyle: function() {
    return this._styleDef;
  },

  getStyleFn: function() {
    return this._styleFn;
  },

  // esta función se nombró reRender en vez de redraw porque redraw ya esta definida en leaflet
  // y permite redibujar un tile pero descargando de nuevo la información.
  reRender: function() {
    const clean = true;
    this._eachTile(interactiveTile => interactiveTile.draw(this._styleFn, clean));
  },

  setFilter: function(fn) {
    this._filter = fn || (() => true);
    this.reRender();
  },

  _eachTile: function(fn) {
    for (let key in this._tiles) {
      const tile = this._tiles[key];
      const interactiveTile = this._getInteractiveTile(tile);
      fn(interactiveTile);
    }
  },

  _getInteractiveTile: function(leafletTile) {
    return leafletTile.el._interactiveTile;
  },

  _getSubdomain: L.TileLayer.prototype._getSubdomain,

  _getVectorTilePromise: function(coords) {
    const tileUrl = L.Util.template(this._url, L.extend({
      s: this._getSubdomain(coords),
      x: coords.x,
      y: coords.y,
      z: coords.z
      // z: this._getZoomForUrl()  /// TODO: Maybe replicate TileLayer's maxNativeZoom
    }, this.options));

    return fetch(tileUrl)
      .then(function(response) {

        if (!response.ok) {
          return {layers:[]};
        }

        return response.blob().then(function(blob) {
          const reader = new FileReader();
          return new Promise(function(resolve) {
            reader.addEventListener('loadend', function() {
              // reader.result contains the contents of blob as a typed array
              // blob.type === 'application/x-protobuf'
              const pbf = new Pbf( reader.result );
              return resolve(new vectorTile.VectorTile(pbf));
            });
            reader.readAsArrayBuffer(blob);
          });
        });
      });
  }
});

module.exports = VectorTileLayer;
