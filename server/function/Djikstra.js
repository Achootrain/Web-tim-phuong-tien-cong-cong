const fs = require('fs');
const init_graph = readGraphData();
const {getNearestStations} = require('./NearestStations');


function readGraphData() {
  try {
    const data = fs.readFileSync('./data/graph.json', 'utf8'); 
    return JSON.parse(data); 
  } catch (err) {
    console.error('Error reading graph.json:', err);
    return null;
  }
}

class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert({ time, node, routeId }) {
        this.heap.push({ time, node, routeId });
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



const busSpeed = 16; 
const metroSpeed = 35; 
const walkingSpeed = 4; 
const waitingForBus = 10*60; 
const waitingForMetro = 15*60; 


function refinePathpoints(pathString) {
    const pathArray = pathString.trim().split(' ').map(point => {
        const [lng, lat] = point.split(',').map(Number);
        return [lng, lat];
      });
    return pathArray
}


function createStateKey(node, routeId) {
    return `${node}|${routeId}`;
}

function caculateSpeed(type) {
    if (type === 1) return busSpeed;
    if (type === 3) return metroSpeed;
    return walkingSpeed;}

function caculateWaitingTime(type,currentRoute,nextRoute,v) {
    if (currentRoute !== nextRoute && v !== '-2') {
        return (type === 3 || type === 4) ? waitingForMetro : waitingForBus;
    }
    return 0;
}



function djikstraMinTimeMinRouteChanges(graph, start, end, useWalking, metro) {
    const dist = {}; 
    const prev = {};
    const routeUsed = {};
    const pathPoints = {};
    const edgeDistance = {};
    const routeChanges = {};
    const travel_time = {}; 

    const visited = new Set(); 
    const pq = new MinHeap(); 

    const startNode = String(start);
    const startKey = createStateKey(startNode, -1);
    
    // Init
    dist[startKey] = 0;
    prev[startKey] = null;
    routeUsed[startKey] = null;
    pathPoints[startKey] = null;
    edgeDistance[startKey] = 0;
    routeChanges[startKey] = 0;
    travel_time[startKey] = 0;
    
   
    pq.insert({ 
        node: startNode, 
        routeId: -1, 
        time: 0 
    });
    //loop
    while (!pq.isEmpty()) {
        const { node: u, routeId: currentRoute, time: currentPriority } = pq.extractMin();
        const currentKey = createStateKey(u, currentRoute);

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        
        const currentRouteChanges = routeChanges[currentKey] || 0;
        const currentTime = travel_time[currentKey] || 0;
        
        if (u === String(end)) {
            const path = [];
            const pathP = [];
            const routes = new Set();
            let current = currentKey;
            let totalDist = 0;
            let newRouteChanges = 0;
            let lastRouteId = null;
            while (current !== null) {
                const [nodeStr, routeStr] = current.split('|');
                const nodeNum = Number(nodeStr);
                const routeId = routeStr ? Number(routeStr) : null;
                path.unshift({ passed: nodeNum, routeId: lastRouteId ?? -1 });

                if (routeId !== null && routeId !== -1) {
                    routes.add(routeId);
                    totalDist += edgeDistance[current] || 0;
                }

                if (pathPoints[current]) {
                    pathP.unshift(...pathPoints[current]);
                }

                const prevKey = prev[current];
                if (prevKey) {
                    const [prevNode, prevRouteStr] = prevKey.split('|');
                    const prevRouteId = Number(prevRouteStr);
                    if (routeId !== prevRouteId) {
                        newRouteChanges++;
                    }
                }

                lastRouteId = routeId ?? -1;
                current = prev[current];
            }
            return {
                routeChanges: newRouteChanges - 2, // trừ đi đoạn đi bộ đầu/cuối
                time: currentTime,
                distance: totalDist,
                routes: Array.from(routes),
                passedRoutePairs: path,
                pathPoints: pathP
            };
        }
        //visit neighbors
        const neighbors = graph[u]?.nextStation || [];

        for (const neighbor of neighbors) {
            const v = String(neighbor.stationId);
            const type = neighbor.type;
            const nextRoute = neighbor.routeId;
            
         
            if ((type === 3 || type === 4) && !metro) continue;
            if ((type === 2 || type === 4) && !useWalking) continue;
       

            const nextKey = createStateKey(v, nextRoute);
            if (visited.has(nextKey)) continue;

            const distBetween = neighbor.distance;

            let speed= caculateSpeed(type);
            let waitingTime = caculateWaitingTime(type, currentRoute, nextRoute, v);
            const transitTime = (distBetween / speed) * 3600; 

            let newRouteChanges = currentRouteChanges;
            const isRouteChange = ((currentRoute !== nextRoute && v !== '-2')||nextRoute === -1) ;
            if (isRouteChange) {
                newRouteChanges++;
            }
            // priority
            const newTime = currentTime + transitTime + waitingTime;
            const newPriority = newRouteChanges * 10000 + newTime;
            const update = !(nextKey in routeChanges) || 
                               newRouteChanges < routeChanges[nextKey] ||
                               (newRouteChanges === routeChanges[nextKey] && newTime < travel_time[nextKey]);
            
            if (update) {
                dist[nextKey] = newPriority;
                prev[nextKey] = currentKey;
                routeUsed[nextKey] = nextRoute;
                pathPoints[nextKey] = refinePathpoints(neighbor.pathPoints);
                edgeDistance[nextKey] = distBetween;
                routeChanges[nextKey] = newRouteChanges;
                travel_time[nextKey] = newTime;
                pq.insert({ time: newPriority,node: v,  routeId: nextRoute});
            }
        }
    }

    return null; 
}


function djikstraMinTime(graph, start, end, useWalking, metro) {
   //init
    const dist = {}; 
    const prev = {};
    const routeUsed = {};
    const pathPoints = {};
    const edgeDistance = {};

    const visited = new Set(); 
    const pq = new MinHeap(); 



    const startNode = String(start);
    
    const startKey = createStateKey(startNode, -1);
    dist[startKey] = 0;
    prev[startKey] = null;
    routeUsed[startKey] = null;
    pathPoints[startKey] = null;
    edgeDistance[startKey] = 0;
    
    pq.insert({ node: startNode, routeId: -1, time: 0 });

    while (!pq.isEmpty()) {
        const { node: u, routeId: currentRoute, time: currentTime } = pq.extractMin();
        const currentKey = createStateKey(u, currentRoute);
    
        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        
        if (u === String(end)) {
            const path = [];
            const pathP = [];
            const routes = new Set();
            let current = currentKey;
            let routeChanges = 0;
            let totalDist = 0;
          
           let lastRouteId = null;

            while (current !== null) {
                const [nodeStr, routeStr] = current.split('|');
                const nodeNum = Number(nodeStr);
                const routeId = routeStr ? Number(routeStr) : null;
                path.unshift({ passed: nodeNum, routeId: lastRouteId ?? -1 });

                if (routeId !== null && routeId !== -1) {
                    routes.add(routeId);
                    totalDist += edgeDistance[current] || 0;
                }

                if (pathPoints[current]) {
                    pathP.unshift(...pathPoints[current]);
                }

                const prevKey = prev[current];
                if (prevKey) {
                    const [prevNode, prevRouteStr] = prevKey.split('|');
                    const prevRouteId = Number(prevRouteStr);
                    if (routeId !== prevRouteId) {
                        routeChanges++;
                    }
                }

                lastRouteId = routeId ?? -1;
                current = prev[current];
            }

    
            return {
                routeChanges:  routeChanges - 2, // trừ đi đoạn đi bộ đầu/cuối
                time: currentTime,
                distance: totalDist,
                routes: Array.from(routes),
                passedRoutePairs: path,
                pathPoints: pathP
            };
        }
        //visit neighbors
        const neighbors = graph[u]?.nextStation || [];

        for (const neighbor of neighbors) {
            const v = String(neighbor.stationId);
            const type = neighbor.type;
            const nextRoute = neighbor.routeId;
            
            if ((type === 3 || type === 4) && !metro) continue;
            if ((type === 2 || type === 4) && !useWalking) continue;

            const nextKey = createStateKey(v, nextRoute);
            if (visited.has(nextKey)) continue;
       
            const distBetween = neighbor.distance;

            let speed=caculateSpeed(type);
            let waitingTime = caculateWaitingTime(type, currentRoute, nextRoute, v);
            
            const transitTime = (distBetween / speed) * 3600; // giây
        
            const alt = currentTime + transitTime + waitingTime;
            
            if (!(nextKey in dist) || alt < dist[nextKey]) {
                dist[nextKey] = alt;
                prev[nextKey] = currentKey;
                routeUsed[nextKey] = nextRoute;
                pathPoints[nextKey] = refinePathpoints(neighbor.pathPoints);
                edgeDistance[nextKey] = distBetween;
                pq.insert({ time: alt, node: v, routeId: nextRoute });
            }
        }
    }

    return null; 
}


// diversify route
function findKroute(start, end, K = 3, useWalking, useMetro, mode) {
    
     const graph = JSON.parse(JSON.stringify(init_graph));
        const startStation = getNearestStations(start.lat,start.lng);
        const endStation = getNearestStations(end.lat, end.lng);
    
        graph[-1] = {
            nextStation: startStation.map(station => ({
                stationId: station.id,
                routeId: -1,
                pathPoints: `${start.lng},${start.lat} ${station.lng},${station.lat}`,
                distance: station.distance,
                type:5//walk to bus
            }))
        };
        graph[-2] = { nextStation: [] };
        endStation.forEach(station => {
            graph[station.id].nextStation.push({
                stationId: -2,
                routeId: -1,
                pathPoints: `${station.lng},${station.lat} ${end.lng},${end.lat}`,
                distance: station.distance,
                type:5//bus to walk
            });
        });
    
    const results = [];
    
    for (let k = 0; k < K; k++) {
       

        for (let pathIndex = 0; pathIndex < results.length; pathIndex++) {
            const previousPaths = results[pathIndex].passedRoutePairs;
            
            for (let i = 0; i < previousPaths.length - 1; i++) {
                const from = previousPaths[i].passed;
                const to = previousPaths[i + 1].passed;
                const fromRouteId = previousPaths[i].routeId;
                const toRouteId = previousPaths[i + 1].routeId;

                if (from !== -1 && to !== -2 && graph[from]?.nextStation) {
                    const edgeIndex = graph[from].nextStation.findIndex(edge => {
                        return edge.stationId === to && 
                               (edge.routeId === toRouteId || 
                                (fromRouteId === -1 && edge.routeId === toRouteId) ||
                                (toRouteId === -1 && edge.routeId === fromRouteId));
                    });

                    if (edgeIndex !== -1) {
                        graph[from].nextStation.splice(edgeIndex, 1);
                    }
                }
            }
        }

        let res;
        if (mode === 1) {
            res = djikstraMinTimeMinRouteChanges(graph, -1, -2, useWalking, useMetro);
        } else {
            res = djikstraMinTime(graph, -1, -2, useWalking, useMetro);
        }

        if (!res) break;
        results.push(res);
    }

    return results;
}

const start = {lat:20.988928921000024,lng:105.83639558900006}
const end={lat:21.037178020000056,lng:105.77668289600007}

const results = findKroute(start, end, 3, true,true,1);

const data = JSON.stringify(results, null, 2);
fs.writeFileSync('./data/paths2.json', data, 'utf8', (err) => {
  if (err) throw err;
  console.log('Data written to file');
})

module.exports = findKroute;