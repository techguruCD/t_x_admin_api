const mongoose = require("mongoose");

const AdsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'enabled'
  },
  expiry: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const AdsModel = mongoose.model("Ads", AdsSchema, "Ads");

module.exports = AdsModel;
