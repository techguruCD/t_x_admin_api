const { BQPairModel } = require("../models/bqPair");

//list
const getBQPairList = async (req, res) => {
  try {
    const bqPairs = await BQPairModel.find({}).limit(10).lean();
    res.status(200).json({ bqPairs });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getBQPairList,
};
