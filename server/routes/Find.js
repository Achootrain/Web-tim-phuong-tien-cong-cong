const express = require('express');
const router = express.Router();
const BusStations = require('../models/BusStation');
const BusRoutes = require('../models/BusRoute');

const {getNearestBusStations} = require('../function/NearestStations');
const BFSMultiStartEnd = require('../function/BFS');
const dijkstraMultiStartEnd = require('../function/Djikstra')


// get nearest bus stations based on latitude and longitude
router.get('/bus', async (req, res) => {
const {lat,lng}=req.query;
if (!lat || !lng) {
return res.status(400).json({ error: "Latitude and Longitude parameters are required" });
}
const nearestStation=getNearestBusStations(lat,lng);
res.json(nearestStation);
});

// find path between two bus stations
router.get('/bus/route', async (req, res) => {
  let { start, end, mode, walking } = req.query;

  const startIds = start ? start.split(',').map(id => parseInt(id)) : [];
  const endIds = end ? end.split(',').map(id => parseInt(id)) : [];

  // Ép kiểu đúng
  mode = parseInt(mode);
  walking = walking === 'true';

  let result = [];
  if (mode === 1) {
    result = BFSMultiStartEnd(startIds, endIds, walking);
  } else if (mode === 2) {
    result = dijkstraMultiStartEnd(startIds, endIds, walking);
  }

  const finalresult = [];
  for (const part of result) {
    const rs = {};

    const stationIds = part.passedRoutePairs.map(pair => pair.passed);
    const stationList = await BusStations.find({ stationId: { $in: stationIds } });
    const stationMap = Object.fromEntries(stationList.map(st => [st.stationId, st]));

    rs.passed = part.passedRoutePairs.map(pair => ({
      station: stationMap[pair.passed],
      route: pair.routeId,
    }));

    rs.pathPoints = part.pathPoints;
    rs.routes = await BusRoutes.find({ routeId: { $in: part.routes } });
    rs.routeChanges = part.routeChanges;

    finalresult.push(rs);
  }

  res.json(finalresult);
});


module.exports = router;