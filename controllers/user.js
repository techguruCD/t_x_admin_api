const bcrypt = require("bcryptjs");
const User = require("../models/user");

//list
const getUserList = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

//signup
const userSignup = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let id = 0;
    const userid = await User.find();
    if (userid.length === 0) {
      id = 1;
    } else {
      const length = userid.length;
      const lastUser = userid[length - 1];
      const lastUserId = lastUser.userId;
      id = lastUserId + 1;
    }

    const user = await User.create({
      userId: id,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: hashedPassword,
    });

    const result = await user.save();
    const { password, ...data } = result.toJSON();

    res.send(data).status(201);
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

module.exports = {
  getUserList,
  userSignup,
};
