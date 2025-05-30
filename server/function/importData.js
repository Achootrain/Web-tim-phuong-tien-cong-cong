const fs = require('fs');
const Stations = require('../models/Station');
const Routes = require('../models/Route'); 
const importData = async () => {
  try {
      const existingStations = await Stations.countDocuments();
      if (existingStations > 0) {
         
      } else {
          const stationsDataRaw = fs.readFileSync('./data/Stations.json', 'utf8');
          const stationsData = JSON.parse(stationsDataRaw);
          await Stations.insertMany(stationsData);
          console.log('Stations imported ');
      }

    
      const existingRoutes = await Routes.countDocuments();
      
      if (existingRoutes > 0) {
      
      } else {
          
          const routesDataRaw = fs.readFileSync('./data/Routes.json', 'utf8');
          const routesJson = JSON.parse(routesDataRaw);
          const data = routesJson.map(route => ({
              id: route.id,
              name: route.name,
              routeId: route.stations[0].routeId,
          }));
          await Routes.insertMany(data);
          console.log('Routes imported successfully!');
      }

  } catch (error) {
      console.error( error);
  }
};

module.exports = { importData };
