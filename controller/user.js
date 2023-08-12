const UserModel = require("../models/user");
const nodemailer = require("nodemailer");
const notifier = require("node-notifier");
const user = require("../models/user");
require("dotenv").config({ path: "config/config.env" });

module.exports.signup = async (req, res) => {
  const newUser = new UserModel({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    mobile: req.body.mobile,
    isVerify: "NO",
  });

  // email should not exist alreday
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      notifier.notify({ title: "Alert!", message: "Email already exists" });
      res.send({ code: 500, message: "Email already exists" });
    } else {
      //save data
      await newUser
        .save()
        .then()
        .catch((err) => {
          console.log("error in saving data" + err);
        });

      try {
        const user = await UserModel.findOne({ email: req.body.email });
        const user_id = user._id;
        sendVerifyMail(req.body.name, req.body.email, user_id);
      } catch (error) {
        console.log("user not found with this email " + error);
      }

      res.send({ code: 200, message: "Signup success" });
    }
  } catch {
    res.send({ code: 500, message: "signup server fail" });
  }
};

//verification mail
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_SEVICE,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_SEVICE,
      to: email,
      subject: "for verification mail",
      html:
        "<p>HI " +
        name +
        ' please click here to <a href="http://localhost:5000/signupverify?id=' +
        user_id +
        '">verify</a> your mail.</p>',
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log("mail" + err);
      } else {
        console.log("Email has been sent : ");
      }
    });
  } catch (error) {
    console.log("error in sending mail" + error.message);
  }
};
module.exports.verifyMail = async (req, res) => {
  try {
    await user.updateOne({ _id: req.query.id }, { $set: { isVerify: "YES" } });
    console.log("email-verified");
    res.render("email-verified");
  } catch (error) {
    console.log("err in verfyMail " + error.message);
  }
};

module.exports.signin = (req, res) => {
  // email and password match

  UserModel.findOne({ email: req.body.email })
    .then((result) => {
      // match password with req.body.password
      if (result.isVerify === "YES") {
        if (result.password !== req.body.password) {
          notifier.notify({ title: "Alert!", message: "YOUR password wrong" });
          res.send({ code: 404, message: "password wrong" });
        } else {
          res.send({
            email: result.email,
            name: result.name,
            code: 200,
            message: "user Found",
            token: "hfgdhg",
          });
        }
      } else {
        notifier.notify({
          title: "Alert!",
          message: "Please verify your mail and then login...",
        });
        res.send({ code: 500, message: "mail verification not completed" });
      }
    })
    .catch((err) => {
      notifier.notify({ title: "Alert!", message: "user not found" });
      res.send({ code: 500, message: "user not found" });
    });

};

module.exports.sendotp = async (req, res) => {
  const _otp = Math.floor(100000 + Math.random() * 900000);
  let user = await UserModel.findOne({ email: req.body.email });
  // send to user mail
  if (!user) {
    notifier.notify({ title: "Alert!", message: "YOU are NOT registerd" });
    res.send({ code: 404, message: "user not found" });
  } else {
    //sending OTP mail to registered user only
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_SEVICE,
        pass: process.env.EMAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "rishavrajverma44job1@gmail.com",
      to: req.body.email, // list of receivers
      subject: "OTP", // Subject line
      text: String(_otp),
      html: `<html>
            < body >
            Hello and welcome <h1>YOUR OTP IS : `+_otp+`</h1></body>
        </ >
       </html > `,
    });

    if (info.messageId) {
      UserModel.updateOne({ email: req.body.email }, { otp: _otp })
        .then((result) => {
          console.log("otp sent");
          res.send({ code: 200, message: "otp send" });
        })
        .catch((err) => {
          res.send({ code: 500, message: "Server err" });
        });
    } else {
      res.send({ code: 500, message: "Server err" });
    }
  }
};

module.exports.submitotp = (req, res) => {
  UserModel.findOne({ otp: req.body.otp })
    .then((result) => {
      //  update the password

      UserModel.updateOne(
        { email: result.email },
        { password: req.body.password }
      )
        .then((result) => {
          notifier.notify({ title: "Alert!", message: "YOUR password is reset" });
          res.send({ code: 200, message: "Password updated" });
        })
        .catch((err) => {
          res.send({ code: 500, message: "Server err" });
        });
    })
    .catch((err) => {
      notifier.notify({ title: "Alert!", message: "WRONG password" });
      res.send({ code: 500, message: "otp is wrong" });
    });
};
