const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config({ path: "config/config.env" });
const UserModel = require("../models/user");
const notifier = require("node-notifier");
require("dotenv").config({ path: "config/config.env" });
const nodemailer = require("nodemailer");

module.exports.orders = async (req, res) => {
  const email = req.body.email;
  try {
    const instance = new Razorpay({
      key_id: process.env.KEY,
      key_secret: process.env.SECRET,
    });

    const options = {
      amount: req.body.amount * 100, // amount in smallest currency unit
      currency: "INR",
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");
  

    try {
      UserModel.findOne({ email: email })
        .then(async (result) => {
          if (result) {
            if (result.PAYMENT != "COMPLETED") {
              res.json(order);
              // Create a single update object with the fields you want to update
              const updateData = {
                razorpay_order_id: order.id,
                PAYMENT: "NOT_COMPLETED",
              };

              await UserModel.updateOne({ email: email }, updateData);
            } else {
              notifier.notify({
                title: "Alert!",
                message: "user allredy paid",
              });
              res.send({ code: 404, message: "user allredy paid" });
            }
          }
        })
        .catch((err) => {
          console.log("DATABASE Server err: " + err);
        });
    } catch (err) {
      console.log("error in order databse saving " + err);
    }

    console.log("order saved");
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports.verify = async (req, res) => {
  try {
    let body = await (req.body.response.razorpay_order_id +
      "|" +
      req.body.response.razorpay_payment_id);

    var expectedSignature = await crypto
      .createHmac("sha256", process.env.SECRET)
      .update(body.toString())
      .digest("hex");
  } catch (error) {
    res.status(500).send(error);
  }

  if (expectedSignature === req.body.response.razorpay_signature) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body.response;
    res.send({ code: 200, message: "payment done" });
    console.log("Payment successful.");

    //database comes here

    await UserModel.findOne({ razorpay_order_id: razorpay_order_id })
      .then(async (result) => {
        if (result) {
          
          // Create a single update object with the fields you want to update
          const updateData = {
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            PAYMENT: "COMPLETED",
          };

          await UserModel.updateOne(
            { razorpay_order_id: result.razorpay_order_id },
            updateData
          );

          //coures confirmation Email

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
              to: result.email,
              subject: "Course Confirmation mail",
              html:
                "<p>HI " +
                result.name +
                "<h3>Thank you for buy our product. Your payment id is " +
                razorpay_payment_id +
                "</h3></p>",
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log("confirmation mail" + err);
              } else {
                console.log("Confirmation Email has been sent : ");
              }
            });
            res.send({code:200, message:"payment success"})
          } catch (error) {
            console.log("error in sending course confirmation mail" + error.message);
          }
          ///////////
        } else {
          console.log("Document not found.");
        }
      })
      .catch((err) => {
        console.log("Server err: " + err);
      });
  } else {
    console.log("INvalid");
    res.send({ code: 500, message: "Sign Invalid" });
  }
};
