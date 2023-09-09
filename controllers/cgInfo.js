const { CGCoinInfoModel } = require("../models/cgInfo");

//list
const getCGInfoList = async (req, res) => {
  try {
    const data = await CGCoinInfoModel.find({}).limit(10);
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getCGInfoList,
};
