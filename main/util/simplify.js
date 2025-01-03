/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
 modified by Jack Qiao
*/

(function () {
  "use strict";

  // to suit your point format, run search/replace for '.x' and '.y';
  // for 3D version, see 3d branch (configurability would draw significant performance overhead)

  // square distance between 2 points
  function getSqDist(p1, p2) {
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y;

    return dx * dx + dy * dy;
  }

  // square distance from a point to a segment
  function getSqSegDist(p, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    // If the segment is a point (p1 and p2 are the same)
    if (dx === 0 && dy === 0) {
      return (p.x - p1.x) ** 2 + (p.y - p1.y) ** 2;
    }
  
    // Compute the projection factor t of point p onto the line defined by p1 and p2
    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
  
    // Clamp t to the range [0, 1] to ensure the closest point is on the segment
    const clampedT = Math.max(0, Math.min(1, t));
  
    // Calculate the closest point on the segment using clampedT
    const closestX = p1.x + clampedT * dx;
    const closestY = p1.y + clampedT * dy;
  
    // Return the squared distance from point p to the closest point on the segment
    const distX = p.x - closestX;
    const distY = p.y - closestY;
  
    return distX ** 2 + distY ** 2;
  }
  
  // rest of the code doesn't care about point format

  // basic distance-based simplification
  function simplifyRadialDist(points, sqTolerance) {
    console.time('simplifyRadialDist');
    var prevPoint = points[0],
      newPoints = [prevPoint],
      point;

    for (var i = 1, len = points.length; i < len; i++) {
      point = points[i];

      if (point.marked || getSqDist(point, prevPoint) > sqTolerance) {
        newPoints.push(point);
        prevPoint = point;
      }
    }

    if (prevPoint !== point) newPoints.push(point);
    console.timeEnd('simplifyRadialDist');
    return newPoints;
  }

  function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance;
    var index = -1;
    var marked = false;
    for (var i = first + 1; i < last; i++) {
      var sqDist = getSqSegDist(points[i], points[first], points[last]);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
      /*if(points[i].marked && maxSqDist <= sqTolerance){
        	index = i;
        	marked = true;
        }*/
    }

    /*if(!points[index] && maxSqDist > sqTolerance){
    	console.log('shit shit shit');
    }*/

    if (maxSqDist > sqTolerance || marked) {
      if (index - first > 1)
        simplifyDPStep(points, first, index, sqTolerance, simplified);
      simplified.push(points[index]);
      if (last - index > 1)
        simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }

  // simplification using Ramer-Douglas-Peucker algorithm
  function simplifyDouglasPeucker(points, sqTolerance) {
    var last = points.length - 1;
    console.time('simplifyDouglasPeucker');
    var simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);
    console.timeEnd('simplifyDouglasPeucker');
    return simplified;
  }

  // both algorithms combined for awesome performance
  function simplify(points, tolerance, highestQuality) {
    console.time('simplify');
    if (points.length <= 2) return points;

    var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);
    console.timeEnd('simplify');
    return points;
  }

  // Exporting all functions for testing and external use
  module.exports = {
    simplify,
    simplifyRadialDist,
    simplifyDouglasPeucker,
    simplifyDPStep,
    getSqDist,
    getSqSegDist
  };
})();

  //   // test
  //   if (require.main === module) {
  //     const points = [
  //         { x: 0, y: 0 },
  //         { x: 1, y: 1 },
  //         { x: 2, y: 2 },
  //         { x: 3, y: 3 },
  //         { x: 4, y: 4 },
  //         { x: 5, y: 5 },
  //         { x: 6, y: 6 },
  //         { x: 7, y: 7 },
  //         { x: 8, y: 8 },
  //         { x: 9, y: 9 },
  //     ];
  
  //     const tolerance = 1;
  //     const highestQuality = false;
  
  //     console.log('Simplified points:', simplify(points, tolerance, highestQuality));
  // }
