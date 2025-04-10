const fs = require('fs');
const graph = readGraphData();
const stationMap = readStationMapData();

function readGraphData() {
  try {
    const data = fs.readFileSync('./data/graph.json', 'utf8'); 
    return JSON.parse(data); 
  } catch (err) {
    console.error('Error reading graph.json:', err);
    return null;
  }
}
function readStationMapData() {
  try {
    const data = fs.readFileSync('./data/stationMap.json', 'utf8'); 
    return JSON.parse(data); 
  } catch (err) {
    console.error('Error reading stationMap.json:', err);
    return null;
  }
}

function findPath(startStations, endStations) {
  if (!graph || !stationMap) {
    console.error("Invalid graph or station map data.");
    return null;
  }

  const queue = startStations.map(station => [station, [{ passed: station, route: null, pathPoints: null }], 0, null]);
  const visited = new Set();
  const results = []; // Use Map to store one path per routeChanges value (0, 1, 2)
  const allEndStationInfos = endStations.flatMap(endStation =>
    (stationMap[endStation] || []).map(info => ({
      ...info,
      endStation 
    }))
  );
  

  
  while (queue.length > 0) {
    const [currentStation, pathArray, routeChanges, routeChosen] = queue.shift();
    const visitKey = currentStation;
    if(results.length>5){return results;}
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);
    const prev = pathArray.length > 1 ? pathArray[pathArray.length - 2] : null;
    const newrouteChanges = (prev!==null&&routeChosen !== null && routeChosen !== prev.route&&prev.route!==null)? routeChanges + 1: routeChanges;
   
    const currentStationInfo = stationMap[currentStation];
  
    //node ./function/BFS.js
    // Direct route check
    for(const info of allEndStationInfos){
      for(const currentRoute of currentStationInfo) {
            if (currentRoute.routeId === info.routeId &&(currentRoute.stationDirection <= info.stationDirection)
              &&currentRoute.stationOrder <= info.stationOrder) {
             // if end station is not used yet, we can use it
              let curr = currentStation;
              const end = info.endStation;
              const res = [...pathArray];
              const visitedset = new Set();
             
              while (curr !== end) {
                const nextStation = graph[curr].nextStation.find(station => (!visitedset.has(station.stationId)&&station.routeId===currentRoute.routeId));
                visitedset.add(curr);
                visited.add(curr);

                if (!nextStation) break;
                curr = nextStation.stationId;
                res.push({ passed: curr, route: currentRoute.routeId, pathPoints: nextStation.pathPoints });
              }
            
              const result = { passed: res,routeChanges:prev?newrouteChanges+1:newrouteChanges};
              results.push(result);
              break
            }
      }
      }     
  

    let nextStations = graph[currentStation]?.nextStation || [];
    nextStations.sort((a, b) => {
      const aPriority = a.routeId === routeChosen ? 0 : 1;
      const bPriority = b.routeId === routeChosen ? 0 : 1;
      return aPriority - bPriority;
    });

    for (const { stationId: nextStation, routeId: nextRouteId, pathPoints: points } of nextStations) {
      const nextVisitKey = nextStation;
      if (visited.has(nextVisitKey)) continue;

        queue.push([
          nextStation,
          [...pathArray, { passed: nextStation, route: nextRouteId, pathPoints: points }],
          newrouteChanges,
          nextRouteId
        ]);

    }
  }
  return results;
}
function refine(data) {

  const sortedData = data.sort((a, b) => a.routeChanges - b.routeChanges).slice(0, 5);

  return sortedData.map(path => {
    let pathPoints = [];
    const routes = [];
    const seenRoutes = new Set();
    const seenPairs = new Set();
    const passedRoutePairs = [];

    const stations = path.passed;

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      let routeUsed = stations[i + 1];

      if (i === stations.length - 1) {
        routeUsed = station;
      }

      const currentRoute = station.route;
      const currentPassed = station.passed;

      if (!seenRoutes.has(currentRoute) && currentRoute != null) {
        routes.push(currentRoute);
        seenRoutes.add(currentRoute);
      }

      if (station.pathPoints) {
        const coords = station.pathPoints
          .split(' ')
          .map(coord => {
            const [lng, lat] = coord.split(',').map(Number);
            return [lng, lat];
          });
        pathPoints.push(...coords);
      }

      if (routeUsed && routeUsed.route != null) {
        const pairKey = `${currentPassed}|${routeUsed.route}`;
        if (!seenPairs.has(pairKey)) {
          passedRoutePairs.push({
            passed: currentPassed,
            routeId: routeUsed.route
          });
          seenPairs.add(pairKey);
        }
      }
    }

    return {
      pathPoints,
      routes,
      routeChanges: path.routeChanges,
      passedRoutePairs
    };
  });
}

function getPaths(startStations, endStations) {
  const paths = findPath(startStations, endStations);
  if (paths) {
    return refine(paths);
  } else {
    return null;
  }
}

// const startStations = [2092,2090,4947,4946,100,98,160,167,101]
// const endStations=[769,770,1073,1074,58785,3216,855,856,857] 
// const paths = getPaths(startStations, endStations);
// const data=JSON.stringify(paths, null, 2);
// console.log(data);
// fs.writeFileSync('./data/paths.json', data, 'utf8', (err) => {
//   if (err) throw err;
//   console.log('Data written to file');
// })

// node ./function/BFS.js



module.exports = getPaths;


