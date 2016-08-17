'use strict';

// return closest point on segment or distance to that point
// see: leaflet/src/geometry/LineUtil.js
function sqClosestPointOnSegment(p, p1, p2, sqDist) {
  let x = p1.x,
      y = p1.y,
      dx = p2.x - x,
      dy = p2.y - y,
      dot = dx * dx + dy * dy,
      t;

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
  let dx = p2.x - p1.x,
      dy = p2.y - p1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

module.exports = {
  pointToSegmentDistance,
  distance
};
