const fs = require('fs');
const rawData = fs.readFileSync('./data/BusRoutes.json', 'utf-8');
const busRoutes = JSON.parse(rawData); 
const {haversine,getNearestBusStations}=require('./NearestStations');

function computePathDistance(pathStr) {
  if (!pathStr || pathStr.trim() === '') {
    return 0; // Không có path => khoảng cách = 0
  }

  const points = pathStr.trim().split(/\s+/).map(p => {
    const [lng, lat] = p.split(',').map(Number);
    return { lat, lng };
  });

  // Nếu chỉ có 1 điểm hoặc tất cả điểm đều giống nhau => khoảng cách = 0
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
busRoutes.forEach(route => {
  route.stations.forEach((station, index) => {
    if (!graph[station.stationId]) {
      graph[station.stationId] = { lat:station.lat,lng:station.lng,nextStation:[] };
      const walkingStation = getNearestBusStations(station.lat, station.lng);
      graph[station.stationId].walkingStation = walkingStation.map(walkingStation => ({
        stationId: walkingStation.id,
        distance:walkingStation.distance,
        pathPoints: `${station.lng},${station.lat} ${walkingStation.lng},${walkingStation.lat}`,
        routeId:-1,
        type:walkingStation.type,
      }));
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
            type:nextStation.stationType,
        });
    }
  });
});
Object.keys(graph).forEach(stationId => {
  const station = graph[stationId];
  
  // Check if the station has walking stations
  if (station.walkingStation && station.walkingStation.length > 0) {
    // Filter out walking stations where stationId matches either:
    // 1. The current station's stationId, or
    // 2. Any nextStation.stationId
    station.walkingStation = station.walkingStation.filter(walking => 
      String(walking.stationId) !== stationId && // Exclude current station's ID
      !station.nextStation.some(next => next.stationId === walking.stationId) // Exclude nextStation IDs
    );
  }
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
      stationMap[station.stationId] = [];
    }

      stationMap[station.stationId].push(stationData);
    
  });
});



fs.writeFileSync('./data/stationMap.json', JSON.stringify(stationMap, null, 2));
fs.writeFileSync('./data/graph.json', JSON.stringify(graph, null, 2));
