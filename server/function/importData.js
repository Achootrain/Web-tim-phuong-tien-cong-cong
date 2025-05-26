const fs = require('fs');
const mongoose = require('mongoose');

const Stations = require('../models/Station');
const Routes = require('../models/Route'); 

const importData = async () => {
  try {
      // Import busStation
      console.log('🔄 Checking existing Stations data...');
      const existingStations = await Stations.countDocuments();

      if (existingStations > 0) {
          console.log('✅ Stations data already exists, skipping import.');
      } else {
          console.log('🔄 Importing Stations...');
          const stationsDataRaw = fs.readFileSync('./data/Stations.json', 'utf8');
          const stationsData = JSON.parse(stationsDataRaw);
          await Stations.insertMany(stationsData);
          console.log('✅ Stations imported successfully!');
      }

      // Import busRoute
      console.log('🔄 Checking existing Routes data...');
      const existingRoutes = await Routes.countDocuments();
      
      if (existingRoutes > 0) {
          console.log('✅ Routes data already exists, skipping import.');
      } else {
          console.log('🔄 Importing Routes...');
          const routesDataRaw = fs.readFileSync('./data/Routes.json', 'utf8');
          const routesJson = JSON.parse(routesDataRaw);
          const data = routesJson.map(route => ({
              id: route.id,
              name: route.name,
              routeId: route.stations[0].routeId,
          }));
          await Routes.insertMany(data);
          console.log('✅ Routes imported successfully!');
      }

  } catch (error) {
      console.error('⛔ Lỗi import dữ liệu:', error);
  }
};

module.exports = { importData };
