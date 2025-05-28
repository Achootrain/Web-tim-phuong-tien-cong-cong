const fs = require('fs');
const init_graph = readGraphData();
const {getNearestBusStations} = require('../function/NearestStations');


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
const busSpeed = 16; // toc do xe buyt
const walkingSpeed = 3;  // Đi bộ
const waitingForBus = 5 * 60; // Thời gian chờ bus khi chuyen tuyen
const waitingForMetro = 25; // Thời gian chờ khi chuyen tuyen metro(giây)
const metroSpeed=35; // tốc độ metro


function dijkstraMinRouteChanges(graph, start, end, useWalking ,metro) {
    const travel_time = {};
    const route_changes = {};
    const previous = {};
    const routeUsed = {};
    const pathPoints = {};
    const distance = {};
    const walkingDistanceSoFar = {};
    const pq = new MinHeap();
    const visited = new Set();
    const MAX_TOTAL_WALKING_DISTANCE = 0.4; // đơn vị: km

    // Initialize data structures
    Object.keys(graph).forEach(node => {
        travel_time[node] = Infinity;
        route_changes[node] = Infinity;
        previous[node] = null;
        routeUsed[node] = null;
        pathPoints[node] = null;
        distance[node] = Infinity;
        walkingDistanceSoFar[node] = 0;
        
    });

    const startNode = String(start);
    travel_time[startNode] = 0;
    route_changes[startNode] = 0;
    pq.insert({ changes: 0, time: 0, node: startNode });

    while (!pq.isEmpty()) {
        const { changes, time, node } = pq.extractMin();
        if (graph[node].usedNode) continue;

        const visitKey = `${node}-${routeUsed[node] || -1}`;
        if (visited.has(visitKey)) continue;
        visited.add(visitKey);

        // Check if we reached the end station
        if (node === String(end)) {
            const path = [];
            const pathP = [];
            const routes = new Set();
            let currentNode = node;
            let dist = 0;

            path.push({ passed: Number(currentNode), routeId: -1 });
            let routeChangesCnt = 0;
            while (currentNode !== null) {
                const routeId = routeUsed[currentNode];
                if (routeId !== null && routeId !== -1) {
                    routes.add(routeId);
                    dist += distance[currentNode];
                }
                if (pathPoints[currentNode]) {
                    pathP.unshift(...pathPoints[currentNode]);
                }
                const prevNode = previous[currentNode];
                if (prevNode) {
                    path.push({ passed: Number(prevNode), routeId: routeUsed[currentNode] });
                     const prevRoute = routeUsed[prevNode];
                      if (routeId !== prevRoute &&routeId!==null&&prevRoute!==null) {
                        routeChangesCnt++; 
                    }
                }
                currentNode = previous[currentNode];
            }
            path.reverse();
            return {
                routeChanges: routeChangesCnt-2, // không tính đi bộ ra bến xe đầu và đi bộ về bến xe cuối
                time: travel_time[node],
                distance: dist,
                routes: Array.from(routes),
                passedRoutePairs: path,
                pathPoints: pathP
            };
        }

        // Bus transit
        const nextStations = graph[node]?.nextStation || [];
        for (const neighbor of nextStations) {
            if(metro===false&&neighbor.type===2)continue;// if not use metro then skip metro edge

            const nextNode = String(neighbor.stationId);
            const currentRoute = routeUsed[node];
            const nextRoute = neighbor.routeId;
            const dist = neighbor.distance;

            const visitKey = `${nextNode}-${nextRoute}`;
            if (visited.has(visitKey)) continue;

            const speed = (nextNode === '-2'||node==='-1') ? walkingSpeed : ((metro&&neighbor.type===2)?metroSpeed:busSpeed);
            const transitTime = (dist / speed) * 3600; // Convert to seconds
            let additionalWaitingTime = 0;
            let newChanges = route_changes[node];

            // Increment route changes if transferring to a different route
            if (currentRoute !== null && currentRoute !== nextRoute && nextNode !== '-2'&&node!=='-1') {
                additionalWaitingTime = (metro&&neighbor.type===2)?waitingForMetro:waitingForBus;
                newChanges = route_changes[node] + 1;
            } else if (nextNode === '-2') {
                newChanges = route_changes[node]; // Walking doesn't count as a route change
            }
        

            const newTime = travel_time[node] + transitTime + additionalWaitingTime;

            if (newChanges < route_changes[nextNode] ) {
                travel_time[nextNode] = newTime;
                route_changes[nextNode] = newChanges;
                previous[nextNode] = node;
                routeUsed[nextNode] = nextRoute;
                pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
                distance[nextNode] = dist;
                pq.insert({ changes: newChanges, time: newTime, node: nextNode });
            }
        }

      if (useWalking) {
        const walkingStations = graph[node]?.walkingStation || [];
        for (const neighbor of walkingStations) {
        if (metro === false && neighbor.type === 2) continue; // if not use metro then skip metro edge
        const nextNode = String(neighbor.stationId);
        const visitKey = `${nextNode}--1`;
        if (visited.has(visitKey)) continue;
        const dist = neighbor.distance;
        const totalWalking = walkingDistanceSoFar[node] + dist;
        if (totalWalking > MAX_TOTAL_WALKING_DISTANCE) continue; // Skip if walking distance exceeds limit

        const walkingTime = (dist / walkingSpeed) * 3600; // Convert to seconds

       
        const newTime = travel_time[node] + walkingTime ;

        const newChanges = route_changes[node]; 
        if (newChanges < route_changes[nextNode] ) {
            travel_time[nextNode] = newTime;
            route_changes[nextNode] = newChanges;
            previous[nextNode] = node;
            routeUsed[nextNode] = -1; // Walking
            pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
            distance[nextNode] = dist;
            pq.insert({ changes: newChanges, time: newTime, node: nextNode });
                }
            }
        }
    }

    return null; // No path found
}

function dijkstra( graph,start,end,useWalking ,metro) {
    const travel_time = {};
    const previous = {};
    const routeUsed = {};
    const pathPoints = {};
    const distance = {};
    const pq = new MinHeap();
    const visited = new Set();
    

    Object.keys(graph).forEach(node => {
        travel_time[node] = Infinity;
        previous[node] = null;
        routeUsed[node] = null;
        pathPoints[node] = null;
        distance[node] = Infinity;
    });
    const startNode = String(start);
    travel_time[startNode] = 0;
    pq.insert({ time: 0, node: startNode });


    while (!pq.isEmpty()) {
      const { time, node } = pq.extractMin();
  
      if(graph[node].usedNode){continue;}

      const visitKey = `${node}-${routeUsed[node]}`;
      if (visited.has(visitKey)) continue;
      visited.add(visitKey);

  
        // Check if we reached  end station
        if (node === String(end)) {
            const path = [];
            const pathP = [];
            const routes = new Set();
            let currentNode = node;
            let routeChanges = 0;
            let dist=0;
        
            path.push({ passed: Number(currentNode), routeId: -1});

            while (currentNode !== null) {
                const routeId = routeUsed[currentNode];
                if (routeId !== null && routeId !== -1) {routes.add(routeId);dist+=distance[currentNode]}
                if (pathPoints[currentNode]) {
                    pathP.unshift(...pathPoints[currentNode]);
                }
                const prevNode = previous[currentNode];
                if (prevNode) {
                    const prevRoute = routeUsed[prevNode];
                    if (routeId !== prevRoute &&routeId!==null&&prevRoute!==null) {
                        routeChanges++; 
                    }
                    
                    path.push({ passed: Number(prevNode), routeId: routeUsed[currentNode] });
                }
                currentNode = previous[currentNode];
            }

            path.reverse();
            const resultTime = travel_time[node];
               return {
                    routeChanges: routeChanges-2, // khong tinh di bo ra ben xe dau va di bo ve ben xe cuoi
                    time: resultTime,
                    distance:dist,
                    routes: Array.from(routes),
                    passedRoutePairs: path,
                    pathPoints: pathP
                 
                };
                  
          
        }

        // Bus transit
        const nextStations = graph[node]?.nextStation || [];
        for (const neighbor of nextStations) {
            if(metro===false&&neighbor.type===2)continue;// if not use metro then skip metro edge

            const nextNode = String(neighbor.stationId);
            const currentRoute = routeUsed[node];
            const nextRoute = neighbor.routeId;
            const dist = neighbor.distance;
            
            const visitKey = `${nextNode}-${nextRoute}`;

            if (visited.has(visitKey)) continue;

           

            const speed=(nextNode==='-2'||node==='-1')?walkingSpeed:((metro&&neighbor.type===2)?metroSpeed:busSpeed);
            const transitTime = (dist / speed) * 3600; // Convert to seconds
            let additionalWaitingTime = 0;// Thời gian chờ thêm nếu chuyển tuyến

            // Add waiting time if transferring to a different route
           
            if (currentRoute !== null && currentRoute !== nextRoute && nextNode !== '-2'&&node!==-1) {//chuyen tuyen, khong tinh lan di bo den ben xe dau tien
                additionalWaitingTime = (metro&&neighbor.type===2)?waitingForMetro:waitingForBus;    
            } 
        
            const newTime = travel_time[node] + transitTime + additionalWaitingTime;
        
            
            if (newTime < travel_time[nextNode]) {
               
                travel_time[nextNode] = newTime;
                previous[nextNode] = node;
                routeUsed[nextNode] = nextRoute;
                pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
                distance[nextNode] = dist;
                pq.insert({ time: newTime, node: nextNode });
            }
        }

        // Walking
        if (useWalking) {
            const walkingStations = graph[node]?.walkingStation || [];
            for (const neighbor of walkingStations) {
              if(metro===false&&neighbor.type===2)continue;// if not use metro then skip metro edge
             
                const nextNode = String(neighbor.stationId);
                const visitKey = `${nextNode}--1`;
                if (visited.has(visitKey)) continue;

                const dist = neighbor.distance;
                const walkingTime = (dist / walkingSpeed) * 3600; // Convert to seconds

                const newTime = travel_time[node] + walkingTime;

            
                if (newTime < travel_time[nextNode]) {
                    travel_time[nextNode] = newTime;
                    previous[nextNode] = node;
                    routeUsed[nextNode] = -1; // Walking
                    pathPoints[nextNode] = refinePathpoints(neighbor.pathPoints);
                    distance[nextNode] = dist;
                    pq.insert({ time: newTime, node: nextNode });
                }
            }
        }
        
    }
   
    return null; // No path found
}


function refinePathpoints(pathString) {
    const pathArray = pathString.trim().split(' ').map(point => {
        const [lng, lat] = point.split(',').map(Number);
        return [lng, lat];
      });
    return pathArray
}




function findKroute(start, end, K=3, useWalking ,useMetro,mode) {
    const graph = JSON.parse(JSON.stringify(init_graph));
    const startStation = getNearestBusStations(start.lat, start.lng);
    const endStation = getNearestBusStations(end.lat, end.lng);

    // Thêm nút bắt đầu (-1) và kết thúc (-2)
    graph[-1] = {
        nextStation: startStation.map(station => ({
            stationId: station.id,
            routeId: -1,
            pathPoints: `${start.lng},${start.lat} ${station.lng},${station.lat}`,
            distance: station.distance
        }))
    };
    graph[-2] = { nextStation: [] };
    endStation.forEach(station => {
        graph[station.id].nextStation.push({
            stationId: -2,
            routeId: -1,
            pathPoints: `${station.lng},${station.lat} ${end.lng},${end.lat}`,
            distance: station.distance
        });
    });

    const results = [];

    // Chạy Dijkstra lần đầu
    let firstPath;
    if(mode===1){
    firstPath = dijkstraMinRouteChanges(graph, -1, -2, useWalking,useMetro);}
    else{
        firstPath = dijkstra(graph, -1, -2, useWalking,useMetro);}

    if (!firstPath) return results;
    results.push(firstPath);
   for (let k = 1; k < K; k++) {
        // Lấy passedRoutePairs từ đường đi trước đó
        const previousPaths = results[k - 1].passedRoutePairs;

        // Xóa các cạnh đã sử dụng từ previousPaths
        for (let i = 0; i < previousPaths.length - 1; i++) {
            const from = previousPaths[i].passed;
            const to = previousPaths[i + 1].passed;
            const routeId = previousPaths[i].routeId;

            if (routeId === -1 && from !== -1 && to !== -2) {
                const edgeIndex = graph[from]?.walkingStation?.findIndex(s => s.stationId == to && s.routeId === -1);
                if (edgeIndex !== -1) {
                    // Xóa cạnh khỏi walkingStation
                    graph[from].walkingStation.splice(edgeIndex, 1);
                }
            } else {
                const edgeIndex = graph[from]?.nextStation?.findIndex(s => s.stationId == to && s.routeId == routeId);
                if (edgeIndex !== -1) {
                    // Xóa cạnh khỏi nextStation
                    graph[from].nextStation.splice(edgeIndex, 1);
                }
            }
        }
        let res;
        if(mode===1){
         res = dijkstraMinRouteChanges(graph, -1, -2, useWalking,useMetro);}
        else{
            res = dijkstra(graph, -1, -2, useWalking,useMetro);
        }
        if (!res) break;
        results.push(res);
        
    }

    return results;
}


// const start={
//   lat: 21.00659755600003,
//   lng: 105.84338102000004
// }
// const end={
//   lat: 21.037113042000044,
//   lng: 105.77478451900004
// }
// const results = findKroute(start, end, 3, true,true,0);

// const data = JSON.stringify(results, null, 2);
// fs.writeFileSync('./data/paths2.json', data, 'utf8', (err) => {
//   if (err) throw err;
//   console.log('Data written to file');
// })

module.exports=findKroute;

//node ./function/Djikstra.js