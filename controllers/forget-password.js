const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const AdminModel = require("../models/admin");

//password verify
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "For Reset Password",
      html:
        "<p> Hii " +
        name +
        ', Please copy the link and <a href = "http://localhost:3003/api/users/reset-password?token = ' +
        token +
        ' "> reset your password </a>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent:-", info.response);
      }
    });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

//forgetpassword
const forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await AdminModel.findOne({ email: email });
    if (userData) {
      const randomString = randomstring.generate();
      const data = await AdminModel.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sendResetPasswordMail(userData.firstname, userData.email, randomString);
      res.status(200).send({
        success: true,
        msg: `http://localhost:3003/api/users/reset-password?token=${randomString}`,
      });
    } else {
      res
        .status(200)
        .send({ success: true, msg: "This email does not exists." });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

//resetpassword
const resetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await AdminModel.findOne({ token: token });
    if (tokenData) {
      const password = req.body.password;
      const newPassword = await hashedPassword(password);
      const userData = await AdminModel.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: newPassword, token: "" } },
        { new: true }
      );
      res.status(200).send({
        success: true,
        msg: "User Password has been reset.",
        data: userData,
      });
    } else {
      res
        .status(200)
        .send({ success: true, msg: "This link has been expired." });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

module.exports = {
  forgetPassword,
  resetPassword,
};
