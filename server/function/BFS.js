const fs = require('fs');
const graph = readGraphData();
const stationMap = readStationMapData();
const limitRouteChanges=4;


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

function findPath(startStations, endStations,walking) {
  if (!graph || !stationMap) {
    console.error("Invalid graph or station map data.");
    return null;
  }

  const queue = startStations.map(station => [station, [{ passed: station, route: null, pathPoints: null }], 0, []]);
  const visited = new Set();
  const results = []; 
  const allEndStationInfos = endStations.flatMap(endStation =>
    (stationMap[endStation] || []).map(info => ({
      ...info,
      endStation 
    }))
  );
  const routeUsed = new Set(); // Track used routes
  const endStationUsed = new Set(); // Track used end stations

  while (queue.length > 0) {
    const [currentStation, pathArray, routeChanges, routeChosen] = queue.shift();
    const visitKey = currentStation;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);
    if (routeChanges === limitRouteChanges) continue;
   
    const prev = routeChosen[routeChosen.length - 1]||null;
    const currentStationInfo = stationMap[currentStation];
    
    let leap=0;
    //check direct route to end stations
    for(const info of allEndStationInfos){
      for(const currentRoute of currentStationInfo) {
            if (currentRoute.routeId === info.routeId &&(currentRoute.stationDirection <= info.stationDirection)
              &&currentRoute.stationOrder <= info.stationOrder) {
              leap=1;
             
              let curr = currentStation;
              const end = info.endStation;
           
             
              const res = [...pathArray];
              const visitedset = new Set();
                 
              let loop=0;
              while (curr !== end) {
                const nextStation = graph[curr].nextStation.find(station => (!visitedset.has(station.stationId)&&station.routeId===currentRoute.routeId));              
                visitedset.add(curr);
                if (!nextStation) {loop=1;break;}
                curr = nextStation.stationId;
                res.push({ passed: curr, route: currentRoute.routeId, pathPoints: nextStation.pathPoints });
              }

              const result = { passed: res,routeChanges: routeChanges + (prev === info.routeId||prev===null||prev===-1 ? 0 : 1)};
              if(loop==0){
              results.push(result);}

              break;
            }
         }
         if(leap==1){break;}
     }     
     if(leap==1) continue; //if direct route found, skip to next iteration
  

    let nextStations = graph[currentStation]?.nextStation || [];
    nextStations.sort((a, b) => {
      const aPriority = a.routeId === prev ? 0 : 1;
      const bPriority = b.routeId === prev ? 0 : 1;
      return aPriority - bPriority;
    });
    

    for (const { stationId: nextStation, routeId: nextRouteId, pathPoints: points } of nextStations) {
      const nextVisitKey = nextStation;
      if (visited.has(nextVisitKey)) continue;

        queue.push([
          nextStation,
          [...pathArray, { passed: nextStation, route: nextRouteId, pathPoints: points }],
          routeChanges + (prev === nextRouteId||prev===null||prev===-1 ? 0 : 1),
          [...routeChosen,nextRouteId]
        ]);
    }
    if(walking){
      const walkingStations = graph[currentStation]?.walkingStation || [];
      for (const { stationId: nextStation, pathPoints: points } of walkingStations) {
        const nextVisitKey = nextStation;
        const nextRouteId = -1; // Walking route ID is -1
        if (visited.has(nextVisitKey)) continue;
        queue.push([
          nextStation,
          [...pathArray, { passed: nextStation, route: -1, pathPoints: points }],
          routeChanges+ 1,
          [...routeChosen,-1]
        ]);
      }
    }
    
  }

  return results;

}



function refine(data) {
  const sortedData = data.sort((a, b) => {
    if (a.routeChanges !== b.routeChanges) {
      return a.routeChanges - b.routeChanges;
    }
    return a.passed.length - b.passed.length;
  }).slice(0, 5);

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
      routes,
      routeChanges: path.routeChanges,
      passedRoutePairs,
      pathPoints
  
    };
  });
}

function BFSMultiStartEnd(startStations, endStations,walking=true) {
  const paths = findPath(startStations, endStations,walking);
  if (paths) {
    return refine(paths);
  } else {
    return null;
  }
}


// const startStations = [2092,2090,4947,4946,100,98,160]
// const endStations=[6220,2137,2112,604,580,6611,581,242]


// const paths = BFSMultiStartEnd(startStations, endStations);
// const data=JSON.stringify(paths, null, 2);

// fs.writeFileSync('./data/paths.json', data, 'utf8', (err) => {
//   if (err) throw err;
//   console.log('Data written to file');
// })

//node ./function/BFS.js



module.exports = BFSMultiStartEnd;


