'use strict';

// return closest point on segment or distance to that point
// see: leaflet/src/geometry/LineUtil.js
function sqClosestPointOnSegment(p, p1, p2, sqDist) {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;
  const dot = dx * dx + dy * dy;
  let t;

  if (dot > 0) {
    t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return sqDist ? dx * dx + dy * dy : {x, y};
}

// Returns the distance between point `p` and segment `p1` to `p2`.
// see: leaflet/src/geometry/LineUtil.js
function pointToSegmentDistance(p, p1, p2) {
  return Math.sqrt(sqClosestPointOnSegment(p, p1, p2, true));
}

function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

// cartesianProduct genera todas las combinaciones posibles entre arrays
// cartesianProduct([[1,2],[3,4]])
// [ [ 1, 3 ], [ 1, 4 ], [ 2, 3 ], [ 2, 4 ] ]
function cartesianProduct(arr) {
  return arr.reduce(function(a, b) {
    return a.map(function(x) {
      return b.map(function(y) {
        return x.concat(y);
      });
    }).reduce(function(a, b) {
      return a.concat(b);
    }, []);
  }, [[]]);
}

function zipObject(keys, values) {
  const obj = {};

  if (keys.length !== values.length) {
    throw Error('zipObject: parameter lengths must be the same');
  }

  for (let i = 0, n = keys.length; i < n; i++) {
    obj[keys[i]] = values[i];
  }

  return obj;
}

function sort(arr) {
  if (!arr.length) {
    return arr;
  }
  if (typeof arr[0] === 'number') {
    return arr.sort((a, b) => a - b);
  }

  return arr.sort();
}

function unique(arr) {
  // asume arreglo ordenado
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === arr[i - 1]) {
      arr.splice(i, 1);
    }
  }

  return arr;
}

module.exports = {
  pointToSegmentDistance,
  distance,
  cartesianProduct,
  zipObject,
  sort,
  unique
};
