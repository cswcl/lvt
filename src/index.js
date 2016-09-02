'use strict';
/* globals fetch, FileReader */

const Pbf = require('pbf');
const vectorTile = require('vector-tile');
const L = require('leaflet');
const InteractiveTile = require('./interactive-tile');
const parseStyle = require('./style').parseStyle;


const VectorTileLayer = L.GridLayer.extend({
  options: {
    subdomains: 'abc'  // Like L.TileLayer
  },


  initialize: function(url, options) {
    L.GridLayer.prototype.initialize.call(this, options);
    this._url = url;
    this.setStyle(options.style || {});
  },

  createTile: function(coords, done) {
    let tile = new InteractiveTile(coords, this.getTileSize().x); // this assumes square tiles
    let vectorTilePromise = this._getVectorTilePromise(coords);
    let style = this._style;

    vectorTilePromise.then(function renderTile(vectorTile) {
      for (let layerId in vectorTile.layers) {
        let layer = vectorTile.layers[layerId];
        tile.addVTLayer(layer);
      }

      tile.draw(style);
      L.Util.requestAnimFrame(done);
    });

    let canvas = tile.getContainer();
    canvas._interactiveTile = tile;

    return canvas;
  },

  query: function (latLng) {
    let point = this._map.project(latLng);
    let tileSize = this.getTileSize().x;  // this assumes square tiles
    let tileXY = point.divideBy(tileSize).floor();
    let xy = point.subtract(tileXY.multiplyBy(tileSize));
    let zoom = this._map.getZoom();
    let tileKey = this._tileCoordsToKey({x: tileXY.x, y: tileXY.y, z: zoom});
    let tile = this._tiles[tileKey];

    if (tile) {
      let interactiveTile = tile.el._interactiveTile;
      return interactiveTile.query({x: xy.x, y: xy.y});
    }
  },

  setStyle: function(style) {
    if (typeof style !== 'object') {
      throw new Error('style must be an object');
    }

    this._styleDef = style;
    this._style = parseStyle(style);
  },

  getStyle: function() {
    return this._styleDef;
  },

  // esta función se nombró reRender en vez de redraw porque redraw ya esta definida en leaflet
  // y permite redibujar un tile pero descargando de nuevo la información.
  reRender: function() {
    for (let key in this._tiles) {
      let tile = this._tiles[key];
      let interactiveTile = tile.el._interactiveTile;
      let clean = true;
      interactiveTile.draw(this._style, clean);
    }
  },

  _getSubdomain: L.TileLayer.prototype._getSubdomain,

  _getVectorTilePromise: function(coords) {
    let tileUrl = L.Util.template(this._url, L.extend({
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
          let reader = new FileReader();
          return new Promise(function(resolve) {
            reader.addEventListener('loadend', function() {
              // reader.result contains the contents of blob as a typed array
              // blob.type === 'application/x-protobuf'
              let pbf = new Pbf( reader.result );
              return resolve(new vectorTile.VectorTile(pbf));
            });
            reader.readAsArrayBuffer(blob);
          });
        });
      });
  }
});

module.exports = VectorTileLayer;
