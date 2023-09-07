const bcrypt = require("bcryptjs");
const UsersModel = require("../models/user");

const getUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await UsersModel.findOne({ userId }).lean();

    if (!user) {
      return res.status(404).json({ msg: 'user not found' });
    }

    return res.status(200).json(user);
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

//list
const getUserList = async (req, res) => {
  try {
    let { skip } = req.query;

    if (parseInt(skip) < 0) {
      skip = 0;
    }

    const [totalUsers, users] = await Promise.all([
      UsersModel.count(),
      UsersModel.find({}).sort({ createdAt: -1 }).skip(parseInt(skip)).limit(10).lean()
    ]);
    res.status(200).json({ totalUsers, users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getUser,
  getUserList,
};
