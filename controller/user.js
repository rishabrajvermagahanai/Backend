const UserModel = require("../models/user");
const nodemailer = require("nodemailer");
const notifier = require('node-notifier');

module.exports.signup = async (req, res) => {
  console.log(req.body);

  const newUser = new UserModel({
    email: req.body.email,
    password: req.body.password,
  });

  // email should not exist alreday
  try {
    let user = await UserModel.findOne({ email: req.body.email});
    if (user) {
      notifier.notify({title: 'Alert!',message: 'Email already exists',});
      res.send({ code: 500, message: "Email already exists" });
    } else {
        //save data
      newUser.save()
        .then(() => {
          res.send({ code: 200, message: "Signup success" });
        })
        .catch((err) => {
          res.send({ code: 500, message: "Signup Err in saving data" });
        });
    }
  } catch {
    res.send({code:500,message:'signup server fail'})
  }
};

module.exports.signin = (req, res) => {

  // email and password match

  UserModel.findOne({ email: req.body.email })
    .then((result) => {
      // match password with req.body.password
      if (result.password !== req.body.password) {
        notifier.notify({title: 'Alert!',message: 'YOUR password wrong',}); 
        res.send({ code: 404, message: "password wrong" });
      } else {
        res.send({
          email: result.email,
          code: 200,
          message: "user Found",
          token: "hfgdhg",
        });
      }
    })
    .catch((err) => {
      notifier.notify({title: 'Alert!',message: 'user not found',});
      res.send({ code: 500, message: "user not found" });
    });

  // newUser.save().then(() => {
  //     res.send({ code: 200, message: 'Signup success' })
  // }).catch((err) => {
  //     res.send({ code: 500, message: 'Signup Err' })
  // })
};

module.exports.sendotp = async (req, res) => {
  console.log(req.body);
  const _otp = Math.floor(100000 + Math.random() * 900000);
  let user = await UserModel.findOne({ email: req.body.email });
  // send to user mail
  if (!user) {
    notifier.notify({title: 'Alert!',message: 'YOU are NOT registerd',});
    res.send({ code: 500, message: "user not found" });
  }

  //sending OTP mail to registered user only
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: "rishavrajverma@gmail.com",
    to: req.body.email, // list of receivers
    subject: "OTP", // Subject line
    text: String(_otp),
    html: `<html>
            < body >
            Hello and welcome
        </ >
       </html > `,
  });

  if (info.messageId) {
    UserModel.updateOne({ email: req.body.email }, { otp: _otp })
      .then((result) => {
        res.send({ code: 200, message: "otp send" });
      })
      .catch((err) => {
        res.send({ code: 500, message: "Server err" });
      });
  } else {
    res.send({ code: 500, message: "Server err" });
  }
};

module.exports.submitotp = (req, res) => {
  console.log(req.body);

  UserModel.findOne({ otp: req.body.otp })
    .then((result) => {
      //  update the password

      UserModel.updateOne(
        { email: result.email },
        { password: req.body.password }
      )
        .then((result) => {
          res.send({ code: 200, message: "Password updated" });
        })
        .catch((err) => {
          res.send({ code: 500, message: "Server err" });
        });
    })
    .catch((err) => {
      res.send({ code: 500, message: "otp is wrong" });
    });
};
