const express = require('express');
const router = express.Router();
const BusStations = require('../models/BusStation');
const BusRoutes = require('../models/BusRoute');


const findKroute = require('../function/Djikstra')


// find path between two bus stations
router.get('/bus/route', async (req, res) => {
  let { start, end, mode, walking,metro } = req.query;

  start = JSON.parse(start);
  end = JSON.parse(end);

    // Ép kiểu đúng
    mode = parseInt(mode); 
    walking = walking === 'true';
    metro = metro === 'true';

  const result = findKroute(start, end, 3, walking, metro, mode);

  const finalresult = [];
  for (const part of result) {
    const rs = {};

    const stationIds = part.passedRoutePairs.map(pair => pair.passed);
    const stationList = await BusStations.find({ stationId: { $in: stationIds } });
    const stationMap = Object.fromEntries(stationList.map(st => [st.stationId, st]));

    // Skip the first and last elements of passedRoutePairs
    rs.passed = part.passedRoutePairs && part.passedRoutePairs.length > 2
      ? part.passedRoutePairs
          .slice(1, -1) // Skip first and last elements
          .filter(pair => stationMap[pair.passed]) // Ensure valid station
          .map(pair => ({
            station: stationMap[pair.passed],
            route: pair.routeId,
          }))
      : [];

    rs.pathPoints = part.pathPoints;
    rs.routes = await BusRoutes.find({ routeId: { $in: part.routes } });
    rs.routeChanges = part.routeChanges;
    rs.time = part.time;
    rs.distance = part.distance;

    finalresult.push(rs);
  }

  res.json(finalresult);
});


module.exports = router;