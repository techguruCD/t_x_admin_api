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

    res.cookie("jwt", token, {
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

//logout
const adminLogout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.send({ msg: "succes" });
};

module.exports = {
  adminLogin,
  adminLogout,
};
