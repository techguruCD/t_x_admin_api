const bcrypt = require("bcryptjs");
const AdminModel = require("../models/admin");

const getAdmin = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const admin = await AdminModel.findOne(
      { _id: adminId },
      { password: 0 }
    ).lean();

    if (!admin) {
      return res.status(404).json({ msg: "admin not found" });
    }

    return res.status(200).json({ email: admin.email });
  } catch (e) {
    return res.status(500).json({ msg: e });
  }
};

//list
const getAdminList = async (req, res) => {
  try {
    const admins = await AdminModel.find({}, { password: 0 }).lean();
    res.status(200).json({ admins });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

//signup
const adminSignup = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await AdminModel.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
    });

    const result = await user.save();

    return res.status(201).json({ email });
  } catch (err) {
    return res.status(500).json({ msg: err });
  }
};

module.exports = {
  getAdmin,
  getAdminList,
  adminSignup,
};
