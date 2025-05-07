const fs = require('fs');

class Node {
    constructor(id, lat, lng, name,address) {
        this.id = id;
        this.lat = lat;
        this.lng = lng;
        this.name = name;
        this.address = address;
       
        this.left = null;
        this.right = null;
    }
}
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; 

    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}

function distanceSquare(lat1, lon1, lat2, lon2) {
    return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
}

function buildKNNKdTree(points, depth = 0) {
    if (points.length === 0) return null;

    let axis = depth % 2;
    points.sort((a, b) => (axis === 0 ? a.lat - b.lat : a.lng - b.lng));

    let median = Math.floor(points.length / 2);
    let node = new Node(
        points[median].stationId,
        points[median].lat,
        points[median].lng,
        points[median].stationName,
        points[median].stationAddress
       
    );
    node.left = buildKNNKdTree(points.slice(0, median), depth + 1);
    node.right = buildKNNKdTree(points.slice(median + 1), depth + 1);

    return node;
}
// K-Nearest Neighbors Search
function findKNearestNeighbors(root, testPoint, k, depth = 0, nearest = []) {
    if (!root) return nearest;

    let axis = depth % 2;
    let pointCoord = axis === 0 ? testPoint.lat : testPoint.lng;
    let rootCoord = axis === 0 ? root.lat : root.lng;

    let currentDistance = distanceSquare(root.lat, root.lng, testPoint.lat, testPoint.lng);

    nearest.push({ node: root, dist: currentDistance });
    nearest.sort((a, b) => a.dist - b.dist);
    
    if (nearest.length > k) nearest.pop();

    let nextBranch = pointCoord < rootCoord ? root.left : root.right;
    let otherBranch = pointCoord < rootCoord ? root.right : root.left;

    nearest = findKNearestNeighbors(nextBranch, testPoint, k, depth + 1, nearest);

    if (nearest.length < k || (rootCoord - pointCoord) ** 2 < nearest[nearest.length - 1].dist) {
        nearest = findKNearestNeighbors(otherBranch, testPoint, k, depth + 1, nearest);
    }

    return nearest;
}

// Main function
const rawData = fs.readFileSync('./data/BusStations.json');
const points = JSON.parse(rawData);
let tree = buildKNNKdTree(points);

function getNearestBusStations(lat, lng,k=8) {
    const testPoint = { lat, lng };
  
  
    let nearestNeighbors = findKNearestNeighbors(tree, testPoint, k);
  
    // Tính khoảng cách
    for (let neighbor of nearestNeighbors) {
      neighbor.dist = haversine(testPoint.lat, testPoint.lng, neighbor.node.lat, neighbor.node.lng);
    }
  
    // Chỉ giữ lại những trạm có distance <= 0.5 km
    return nearestNeighbors
      .filter(neighbor => neighbor.dist <= 0.5)
      .map(neighbor => ({
        id: neighbor.node.id,
        name: neighbor.node.name,
        address: neighbor.node.address,
        lat: neighbor.node.lat,
        lng: neighbor.node.lng,
        distance: neighbor.dist 
      }));
  }
  


module.exports = {getNearestBusStations,haversine};