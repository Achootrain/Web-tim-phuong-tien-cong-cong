const fs = require('fs');
const path = require('path');
const graph = readGraphData();

function readGraphData() {
  try {
    const data = fs.readFileSync('./data/graph.json', 'utf8'); 
    return JSON.parse(data); 
  } catch (err) {
    console.error('Error reading graph.json:', err);
    return null;
  }
}

// Lớp MinHeap để quản lý hàng đợi ưu tiên
class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert({ time, node }) {
        this.heap.push({ time, node });
        this._bubbleUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.heap.length === 1) return this.heap.pop();
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this._bubbleDown(0);
        return min;
    }

    _bubbleUp(index) {
        const element = this.heap[index];
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            if (element.time >= parent.time) break;
            this.heap[index] = parent;
            index = parentIndex;
        }
        this.heap[index] = element;
    }

    _bubbleDown(index) {
        const length = this.heap.length;
        const element = this.heap[index];
        while (true) {
            let minIndex = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;

            if (leftChild < length && this.heap[leftChild].time < this.heap[minIndex].time) {
                minIndex = leftChild;
            }
            if (rightChild < length && this.heap[rightChild].time < this.heap[minIndex].time) {
                minIndex = rightChild;
            }
            if (minIndex === index) break;

            this.heap[index] = this.heap[minIndex];
            this.heap[minIndex] = element;
            index = minIndex;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

// Tốc độ (km/h)
const transitSpeed = 30; // Phương tiện giao thông
const walkingSpeed = 5;  // Đi bộ
const waitingTime = 5 * 60; // Thời gian chờ khi chuyen tuyen(giây)


function dijkstraMultiStartEnd(startStations, endStations, useWalking = true) {
    const distances = {};
    const previous = {};
    const routeUsed = {};
    const pathPoints = {};
    const pq = new MinHeap();
    const visited = new Set();
    const results = [];
    const endSet = new Set(endStations.map(String));
    const maxResults = 3;
    const delta = 5 * 60; // Allow up to 5 minutes slower
    let minTime = Infinity;

    // Initialize nodes
    Object.keys(graph).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
        routeUsed[node] = null;
        pathPoints[node] = null;
    });

    // Initialize starting nodes
    for (const start of startStations) {
        const startNode = String(start);
        distances[startNode] = 0;
        pq.insert({ time: 0, node: startNode });
    }

    while (!pq.isEmpty()) {
        const { time, node } = pq.extractMin();
        if (visited.has(node)) continue;
        visited.add(node);

        // Check if we reached an end station
        if (endSet.has(node)) {
            const path = [];
            const pathP = [];
            const routes = new Set();
            let currentNode = node;
            let routeChanges = 0;
            let finalRouteId = routeUsed[previous[node]];
            path.push({ passed: Number(currentNode), routeId: finalRouteId });

            while (currentNode !== null) {
                const routeId = routeUsed[currentNode];
                if (routeId !== null && routeId !== -1) routes.add(routeId);
                if (pathPoints[currentNode]) {
                    pathP.unshift(...pathPoints[currentNode]);
                }
                const prevNode = previous[currentNode];
                if (prevNode) {
                    const prevRoute = routeUsed[prevNode];
                    if (routeId !== prevRoute ) {
                        routeChanges++; // Increment route changes for bus-to-bus transfers
                    }
                    path.push({ passed: Number(prevNode), routeId: routeUsed[currentNode] });
                }
                currentNode = previous[currentNode];
            }

            path.reverse();
            const resultTime = distances[node];
            if (results.length === 0) minTime = resultTime;

            if (resultTime <= minTime + delta) {
                results.push({
                    routeChanges: routeChanges, // Adjust for final node
                    passedRoutePairs: path,
                    time: resultTime,
                    pathPoints: pathP,
                    routes: Array.from(routes),
                });
            }

            if (results.length >= maxResults) break;
        }

        // Bus transit
        const nextStations = graph[node]?.nextStation || [];
        for (const neighbor of nextStations) {
            const nextNode = String(neighbor.stationId);
            if (visited.has(nextNode)) continue;

            const distance = neighbor.distance;
            const transitTime = (distance / transitSpeed) * 3600; // Convert to seconds
            let additionalWaitingTime = 0;

            // Add waiting time if transferring to a different route
            const currentRoute = routeUsed[node];
            const nextRoute = neighbor.routeId;
            if (currentRoute !== null && currentRoute !== -1 && currentRoute !== nextRoute) {
                additionalWaitingTime = waitingTime;
            }

            const newTime = distances[node] + transitTime + additionalWaitingTime;

            if (newTime < distances[nextNode]) {
                distances[nextNode] = newTime;
                previous[nextNode] = node;
                routeUsed[nextNode] = nextRoute;
                pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
                pq.insert({ time: newTime, node: nextNode });
            }
        }

        // Walking
        if (useWalking) {
            const walkingStations = graph[node]?.walkingStation || [];
            for (const neighbor of walkingStations) {
                const nextNode = String(neighbor.stationId);
                if (visited.has(nextNode)) continue;

                const distance = neighbor.distance;
                const walkingTime = (distance / walkingSpeed) * 3600; // Convert to seconds
                const newTime = distances[node] + walkingTime;

                if (newTime < distances[nextNode]) {
                    distances[nextNode] = newTime;
                    previous[nextNode] = node;
                    routeUsed[nextNode] = -1; // Walking
                    pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
                    pq.insert({ time: newTime, node: nextNode });
                }
            }
        }
    }

    return results.length > 0 ? results : null;
}
function refinePathpoints(pathString) {
    const pathArray = pathString.trim().split(' ').map(point => {
        const [lng, lat] = point.split(',').map(Number);
        return [lng, lat];
      });
    return pathArray
}
// Hàm chạy cả hai trường hợp
function findShortestPath(start, end) {
    console.log("=== Trường hợp sử dụng walkingStation ===");
    const resultWithWalking = dijkstraMultiStartEnd(start, end, true);
    console.log("Đường đi:", resultWithWalking.path);
    console.log(resultWithWalking.message);

    console.log("\n=== Trường hợp không sử dụng walkingStation ===");
    const resultWithoutWalking = dijkstraMultiStartEnd( start, end, false);
    console.log("Đường đi:", resultWithoutWalking.path);
    console.log(resultWithoutWalking.message);
}



// const startStations = [329,1941,325,326,749,636,58074,532]
// const endStations=[5607,5663,59058,59061,3687,3743,3744,3688] 
// const results = dijkstraMultiStartEnd(startStations, endStations, true);
// const data = JSON.stringify(results, null, 2);
// fs.writeFileSync('./data/paths2.json', data, 'utf8', (err) => {
//   if (err) throw err;
//   console.log('Data written to file');
// })

module.exports=dijkstraMultiStartEnd

//node ./function/Djikstra.js