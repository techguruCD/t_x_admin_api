const AdsModel = require("../models/ads");

const createAd = async (req, res) => {
  try {
    const { name, image, url, status, expiry } = req.body;
    const newAd = await new AdsModel({
      name,
      image,
      url,
      status,
      expiry,
    }).save();

    return res.status(200).json(newAd);
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const getAds = async (req, res) => {
  try {
    const ads = await AdsModel.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ ads });
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const getAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await AdsModel.findOne({ _id: id }).lean();
    return res.status(200).json({ ad });
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const updateAds = (req, res) => {
  try {
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await AdsModel.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ad) {
      return res.status(404).json({ msg: "ad not found" });
    }
    return res.status(200).json({ ad });
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await AdsModel.findOneAndDelete({ _id: id });
    if (!ad) {
      return res.status(404).json({ msg: "ad not found" });
    }
    return res.status(200).json({ ad });
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

const deleteAds = (req, res) => {
  try {
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

module.exports = {
  createAd,
  getAds,
  getAd,
  updateAd,
  updateAds,
  deleteAd,
  deleteAds,
};
