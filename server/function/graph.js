const fs = require('fs');
const rawData = fs.readFileSync('./data/BusRoutes.json', 'utf-8');
const busRoutes = JSON.parse(rawData); 
const graph = {};
busRoutes.forEach(route => {
  route.stations.forEach((station, index) => {

    if (!graph[station.stationId]) {
      graph[station.stationId] = { nextStation:[] };
    }
    if (index < route.stations.length - 1) {

        const nextStation = route.stations[index + 1];
        graph[station.stationId].nextStation.push({
            stationId: nextStation.stationId,
            routeId: nextStation.routeId,
            pathPoints: nextStation.pathPoints,
        });
    }
  });
});

const stationMap = {};

busRoutes.forEach(route => {
  route.stations.forEach(station => {
    const stationData = {
      routeId: station.routeId,
      stationDirection: station.stationDirection,
      stationOrder: station.stationOrder
    };
    
    if (!stationMap[station.stationId]) {
      stationMap[station.stationId]= [];
    }
    stationMap[station.stationId].push(stationData);
  });
});



fs.writeFileSync('stationMap.json', JSON.stringify(stationMap, null, 2));
fs.writeFileSync('graph.json', JSON.stringify(graph, null, 2));
