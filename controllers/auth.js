const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

//login
const userLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ msg: `User not available with the email id: ${email}` });
    }
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).send({ msg: `invalid password` });
    }

    const token = jwt.sign({ _id: user._id }, "secret");
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    const payload = {
      message: "Login successful",
      roles: "USERROLES",
      token: token,
    };
    res.status(201).send({
      msg: payload.message,
      roles: payload.roles,
      access_token: payload.token,
      user,
    });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

const getUser = async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];
    const claims = jwt.verify(cookie, "secret");
    if (!claims) {
      return res.status(401).send({ msg: "unauthenticated" });
    }
    const user = await User.findOne({ _id: claims._id });
    const { password, ...data } = await user.toJSON();
    res.send(data);
  } catch (e) {
    return res.status(401).send({ msg: "unauthenticated" });
  }
};

//logout
const userLogout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.send({ msg: "succes" });
};

module.exports = {
  userLogin,
  getUser,
  userLogout,
};
