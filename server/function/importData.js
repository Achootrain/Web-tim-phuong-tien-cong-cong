const fs = require('fs');
const mongoose = require('mongoose');

const BusStations = require('../models/BusStation');
const BusRoutes = require('../models/BusRoute'); 
const importData = async () => {
  try {
      //import busStation
      console.log('🔄 Checking existing BusStations data...');
      const existingStations = await BusStations.countDocuments();
      
      if (existingStations > 0) {
          console.log('✅ BusStations data already exists, skipping import.');
      } else {
          console.log('🔄 Importing BusStations...');
          const stationsData = fs.readFileSync('./data/BusStations.json', 'utf8');
          const busStations = JSON.parse(stationsData);
          await BusStations.insertMany(busStations);
          console.log('✅ BusStations imported successfully!');
      }

      //import busRoute
        console.log('🔄 Checking existing BusRoutes data...');
        const existingRoutes = await BusRoutes.countDocuments();
        if (existingRoutes > 0) {
            console.log('✅ BusRoutes data already exists, skipping import.');
        }
        else {
            console.log('🔄 Importing BusRoutes...');
            const routesData = fs.readFileSync('./data/BusRoutes.json', 'utf8');
            const busRoutes = JSON.parse(routesData);
            const data = busRoutes.map(route => {
                return {
                    id: route.id,
                    name: route.name,
                    routeId: route.stations[0].routeId,
                };
            }   );
            await BusRoutes.insertMany(data);
            console.log('✅ BusRoutes imported successfully!');
        }

  } catch (error) {
      console.error('⛔ Lỗi import dữ liệu:', error);
    }
};
module.exports = { importData };