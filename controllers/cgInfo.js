const { CGCoinInfoModel } = require("../models/cgInfo");

//list
const getCGInfoList = async (req, res) => {
  try {
    const cgInfos = await CGCoinInfoModel.find({}).limit(10).lean();
    res.status(200).json({ cgInfos });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getCGInfoList,
};
