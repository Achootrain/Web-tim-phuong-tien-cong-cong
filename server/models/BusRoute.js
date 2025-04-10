const mongoose = require('mongoose');
const BusRoutesSchema = new mongoose.Schema({
  id: {
      type: Number,
      required: true,
      unique: true
  },
  name: {
      type: String,
      required: true
  },
  routeId: {
    type: Number,
    required: true,
    unique: true
  },

}, { _id: false,timestamps: false });

module.exports = mongoose.model('BusRoutes', BusRoutesSchema);