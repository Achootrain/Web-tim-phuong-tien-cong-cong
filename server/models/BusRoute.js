const mongoose = require('mongoose');

const busRoutesSchema = new mongoose.Schema({
  bus: { type: String, required: true },
  price: { type: Number, required: true },
  activityTime: { type: String, required: true },
  gianCachChayXe: { type: String, required: true },
  gianCachTrungBinh: { type: Number, required: true },
  chieuDi: [{ type: String }],
  chieuVe: [{ type: String }]
});

module.exports = mongoose.model('BusRoutes', busRoutesSchema);