const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const getNearestStations = require('../data/NearestStations');
const BusRoutes = require('../models/BusRoute');
const BusStations = require('../models/BusStation');
const { ObjectId } = require('mongodb');

router.get('/bus', async (req, res) => {
const {lat,lng}=req.query;
if (!lat || !lng) {
return res.status(400).json({ error: "Latitude and Longitude parameters are required" });
}
const nearestStation=getNearestStations(lat,lng);
res.json(nearestStation);
});

router.get('/bus/route', async (req, res) => {
    let startStations = [
        { id: "6657dc9c027e08d615684c99", name: "Đối diện đường vào Học viện Khoa học Quân Sự", lat: 20.988533333333, long: 105.83496666667, buses: ["84"], distance: 0.15473090240561352 },
        { id: "6657dc9c027e08d615684c91", name: "CT36 Tower - 24 Lê Trọng Tấn", lat: 20.988283333333, long: 105.83493333333, buses: ["84"], distance: 0.1679248368496825 },
        { id: "6657dc92027e08d6156846d4", name: "Trạm biến áp số 9 Định Công - Cạnh Chợ Xanh Định Công", lat: 20.985633333333, long: 105.83353333333, buses: ["12"], distance: 0.4717925944529332 },
        { id: "6657dc92027e08d6156846c5", name: "Công viên Định Công", lat: 20.987, long: 105.8322, buses: ["12"], distance: 0.48552179995308753 },
        { id: "6657dc92027e08d615684527", name: "352 Giải Phóng", lat: 20.9876, long: 105.84095, buses: ["03A", "08A", "21A", "25", "28", "32", "41", "08BCT", "08B", "03B", "16", "21B", "08ACT"], distance: 0.4953806123813556 },
        { id: "6657dc92027e08d61568450d", name: "649 Giải Phóng", lat: 20.989377, long: 105.841261, buses: ["03A", "08A", "21A", "25", "28", "32", "41", "08BCT", "08B", "03B", "16", "21B", "08ACT"], distance: 0.5075634960473647 }
      ];
      let endStations = [
        { id: "6657dc9c027e08d615684e63", name: "Trước cầu vượt Xuân Phương 100m", lat: 21.036683, long: 105.748983, buses: ["97"], distance: 0.7291601246648561 },
        { id: "6657dc9c027e08d615684e6e", name: "Qua cầu vượt Xuân Phương 100m", lat: 21.037016666667, long: 105.74896666667, buses: ["97"], distance: 0.7662905180100098 },
        { id: "6657dc97027e08d615684ac4", name: "Đối diện Công ty TNHH và Dịch Vụ Đăng Khoa", lat: 21.027642, long: 105.741035, buses: ["57"], distance: 0.91885747250376 },
        { id: "6657dc97027e08d615684aa5", name: "Công ty TNHH và Dịch Vụ Đăng Khoa - Xuân Phương", lat: 21.027016, long: 105.741091, buses: ["57"], distance: 0.9368527182182915 },
        { id: "6657dc97027e08d615684ac3", name: "Qua lối cổng vào Trường Cao Đẳng Công Nghệ Cao 30m", lat: 21.023119, long: 105.742741, buses: ["57"], distance: 1.0478645823785804 },
        { id: "6657dc97027e08d615684aa6", name: "Qua lối vào Trường Cao Đẳng Công Nghệ Cao Hà Nội 30m-Xuân Phương", lat: 21.022433319485657, long: 105.74350508184195, buses: ["57"], distance: 1.057528825276128 }
      ];
      
    try {
        const allStations = await BusStations.find({});
        const stationMap = new Map(allStations.map(st => [st._id.toString(), st]));
        let queue = startStations.map(station => ({ station, path: [station.name], buses: station.buses }));
        let visited = new Set(startStations.map(station => station.name));
        let foundRoutes = [];
        while (queue.length > 0) {
            let { station: currentStation, path, buses } = queue.shift();

            if (endStations.some(end => end.name === currentStation.name)) {
                foundRoutes.push({ route: path, buses });
                continue;
            }

            const routes = await BusRoutes.find({ bus: { $in: currentStation.buses } });
            
            
            for (let route of routes) {
                const routeStations = [...route.chieuDi, ...route.chieuVe];
                let currentIndex = routeStations.findIndex(stationId => stationId === currentStation.id);
                console.log(currentIndex);
                if (currentIndex !== -1) {
                    for (let i = currentIndex + 1; i < routeStations.length; i++) {
                        let nextStationId = routeStations[i];
                        let nextStation = stationMap.get(nextStationId.toString());

                        if (nextStation && !visited.has(nextStation.name)) {
                            visited.add(nextStation.name);
                            queue.push({
                                station: nextStation,
                                path: [...path, nextStation.name],
                                buses: [...new Set([...buses, ...nextStation.buses])]
                            });
                        }
                    }
                }
            }
        }

        if (foundRoutes.length > 0) {
            foundRoutes.sort((a, b) => a.route.length - b.route.length);
            return res.json({ routes: foundRoutes });
        }

        res.json({ error: 'Không tìm thấy tuyến xe buýt phù hợp' });
    } catch (error) {
        console.error('Error finding route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;