const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminModel = require("../models/admin");

//login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AdminModel.findOne({ email }).lean();

    if (!admin) {
      return res
        .status(404)
        .json({ msg: `Admin not available with the email id: ${email}` });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).send({ msg: `invalid password` });
    }

    const token = jwt.sign({ _id: admin._id }, `${process.env.JWT_SECRET}`);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const payload = {
      message: "Login successful",
      roles: "ADMINROLES",
      token: token,
    };

    res.status(201).send({
      msg: payload.message,
      roles: payload.roles,
      access_token: payload.token,
      admin,
    });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

const getAdmin = async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];
    const claims = jwt.verify(cookie, `${process.env.JWT_SECRET}`);
    if (!claims) {
      return res.status(401).send({ msg: "unauthenticated" });
    }
    const admin = await AdminModel.findOne({ _id: claims._id }, { password: 0 }).lean();

    if (!admin) {
      return res.status(404).json({ msg: 'admin not found' });
    }

    return res.status(200).json({email: admin.email});
  } catch (e) {
    return res.status(401).send({ msg: "unauthenticated" });
  }
};

//logout
const adminLogout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.send({ msg: "succes" });
};

module.exports = {
  adminLogin,
  getAdmin,
  adminLogout,
};
