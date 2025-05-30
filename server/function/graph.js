const fs = require('fs');
const rawData = fs.readFileSync('./data/Routes.json', 'utf-8');
const Routes = JSON.parse(rawData); 
const {haversine,getNearestBusStations}=require('./NearestStations');

function computePathDistance(pathStr) {
  if (!pathStr || pathStr.trim() === '') {
    return 0; 
  }

  const points = pathStr.trim().split(/\s+/).map(p => {
    const [lng, lat] = p.split(',').map(Number);
    return { lat, lng };
  });

  if (points.length < 2 || points.every(p => p.lat === points[0].lat && p.lng === points[0].lng)) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }

  return total;
}
const graph = {};
Routes.forEach(route => {
  route.stations.forEach((station, index) => {
    if (!graph[station.stationId]) {
      graph[station.stationId] = { lat:station.lat,lng:station.lng,nextStation:[] };
      
    const walkingStations = getNearestBusStations(station.lat, station.lng);
      walkingStations.forEach(walkingStation => {
        if (walkingStation.id !== station.stationId) {
          graph[station.stationId].nextStation.push({
            stationId: walkingStation.id,
            distance: walkingStation.distance,
            pathPoints: `${station.lng},${station.lat} ${walkingStation.lng},${walkingStation.lat}`,
            routeId: -1,
            type: walkingStation.type===1?2:4,//bus-walk-bus:bus-walk-metro
          });
        }
      });
    }


    if (index < route.stations.length - 1) {
        const nextStation = route.stations[index + 1];
        if(nextStation.stationId===station.stationId) return;
        const path = [
          `${station.lng},${station.lat}`,
          nextStation.pathPoints?.trim(), // sẽ bỏ qua nếu undefined hoặc ""
          `${nextStation.lng},${nextStation.lat}`
        ].filter(Boolean).join(' ');
        
        graph[station.stationId].nextStation.push({
            stationId: nextStation.stationId,
            routeId: nextStation.routeId,
            pathPoints: path,
            distance:computePathDistance(path),
            type:nextStation.stationType===1?1:3//bus-bus:metro-metro
        });
    }
  });
});


fs.writeFileSync('./data/graph.json', JSON.stringify(graph, null, 2));
