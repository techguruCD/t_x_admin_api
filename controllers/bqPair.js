const { BQPair } = require("../models/bqPair");

//list
const getBQPairList = async (req, res) => {
  try {
    const data = await BQPair.find({}).limit(10);
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getBQPairList,
};
