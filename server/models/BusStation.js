const mongoose = require('mongoose');
const BusStationSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    buses: [String],
    lat: Number,
    long: Number
  });
  
module.exports = mongoose.model('BusStations', BusStationSchema);

