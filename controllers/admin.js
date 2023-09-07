const bcrypt = require("bcryptjs");
const AdminModel = require("../models/admin");

//list
const getAdminList = async (req, res) => {
  try {
    const admins = await AdminModel.find({});
    res.status(200).json({ admins });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

//signup
const adminSignup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await AdminModel.create({
      email,
      password: hashedPassword,
    });

    const result = await user.save();

    return res.status(201).json({ email });
  } catch (err) {
    return res.status(500).json({ msg: err });
  }
};

module.exports = {
  getAdminList,
  adminSignup,
};
