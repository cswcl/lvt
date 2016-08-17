'use strict';
/* globals document, fetch, FileReader */

const Pbf = require('pbf');
const vectorTile = require('vector-tile');
const L = require('leaflet');
const InteractiveTile = require('./interactive-tile');


// allow gridLayer to be interactive
let lastSheet = document.styleSheets[document.styleSheets.length - 1];
lastSheet.insertRule('.interactive .leaflet-tile-container {pointer-events: auto}');

const VectorGrid = L.GridLayer.extend({
  createTile: function(coords, done) {
    let tile = new InteractiveTile(coords, this.getTileSize().x, this.options); // this assumes square tiles
    let vectorTilePromise = this._getVectorTilePromise(coords);

    vectorTilePromise.then(function renderTile(vectorTile) {
      for (let layerId in vectorTile.layers) {
        let layer = vectorTile.layers[layerId];
        tile.addVTLayer(layer);
      }

      tile.draw();
      L.Util.requestAnimFrame(done);
    });

    return tile.getContainer();
  }
});

const VectorTileLayer = VectorGrid.extend({
  options: {
    subdomains: 'abc',  // Like L.TileLayer
  },


  initialize: function(url, options) {
    this._url = url;

    if (options.className) {
      let hasInteractiveClass = (options.className.split(/\s+/).indexOf('interactive') >= 0);
      if (!hasInteractiveClass) {
        options.className += ' interactive'; 
      }
    } else {
      options.className = 'interactive';
    }

    VectorGrid.prototype.initialize.call(this, options);
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
      })
      .then(function(vectorTile) {
        // Normalize feature getters into actual instanced features
        for (let layerName in vectorTile.layers) {
          let features = [];

          for (let i = 0; i < vectorTile.layers[layerName].length; i++) {
            let feature = vectorTile.layers[layerName].feature(i);
            feature.geometry = feature.loadGeometry();
            features.push(feature);
          }

          vectorTile.layers[layerName].features = features;
        }

        return vectorTile;
      });
  }
});

module.exports = VectorTileLayer;
