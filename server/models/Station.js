const mongoose = require('mongoose');
const StationsSchema = new mongoose.Schema({
  stationId: {
      type: Number,
      required: true,
      unique: true
  },
  stationName: {
      type: String,
      required: true
  },
  stationAddress: {
      type: String,
      required: false
  },
  lat: {
      type: Number,
      required: true
  },
  lng: {
      type: Number,
      required: true
  },
    stationType: {
        type: Number,
        required: true
    },
}, {_id:false, timestamps: false });

module.exports = mongoose.model('Stations', StationsSchema);
