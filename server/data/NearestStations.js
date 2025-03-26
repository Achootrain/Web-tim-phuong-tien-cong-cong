const fs = require('fs');

class Node {
    constructor(id, lat, long, name, buses) {
        this.id = id;
        this.lat = lat;
        this.long = long;
        this.name = name;
        this.buses = buses;
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
    points.sort((a, b) => (axis === 0 ? a.lat - b.lat : a.long - b.long));

    let median = Math.floor(points.length / 2);
    let node = new Node(
        points[median]._id,
        points[median].lat,
        points[median].long,
        points[median].name,
        points[median].buses
    );
    node.left = buildKNNKdTree(points.slice(0, median), depth + 1);
    node.right = buildKNNKdTree(points.slice(median + 1), depth + 1);

    return node;
}
// K-Nearest Neighbors Search
function findKNearestNeighbors(root, testPoint, k, depth = 0, nearest = []) {
    if (!root) return nearest;

    let axis = depth % 2;
    let pointCoord = axis === 0 ? testPoint.lat : testPoint.long;
    let rootCoord = axis === 0 ? root.lat : root.long;

    let currentDistance = distanceSquare(root.lat, root.long, testPoint.lat, testPoint.long);

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
function getNearestBusStations(lat, long) {
const testPoint = { lat, long };
const rawData = fs.readFileSync('./data/BusStations.json');
const points = JSON.parse(rawData);

let tree = buildKNNKdTree(points);
let k = 6;

let nearestNeighbors = findKNearestNeighbors(tree, testPoint, k);
for (let neighbor of nearestNeighbors) {
    neighbor.dist = haversine(testPoint.lat, testPoint.long, neighbor.node.lat, neighbor.node.long);
}
return nearestNeighbors.map(neighbor => ({
    id: neighbor.node.id,
    name: neighbor.node.name,
    lat: neighbor.node.lat,
    long: neighbor.node.long,
    buses: neighbor.node.buses,
    distance: neighbor.dist 
}))
}


module.exports = getNearestBusStations;