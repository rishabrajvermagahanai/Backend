const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config({ path: "config/config.env" });
const UserModel = require("../models/user");

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
  
    res.json(order);


    try{
    UserModel.findOne({ email: email })
      .then(async (result) => {
        if (result) {
          // Create a single update object with the fields you want to update
          const updateData = {
            razorpay_order_id: order.id,
            PAYMENT: "NOT COMPLITED",
          };

          await UserModel.updateOne(
            { email: email },
            updateData
          );

          console.log("order saved and updated");
        } else {
          console.log("Document not found.");
        }
      })
      .catch((err) => {
        console.log("Server err: " + err);
      });
    }catch(err){
      console.log("error in order databse saving "+err);
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

    //database comes here

    UserModel.findOne({ razorpay_order_id: razorpay_order_id })
      .then(async (result) => {
        if (result) {
          // Create a single update object with the fields you want to update
          const updateData = {
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            PAYMENT: "COMPLITED",
          };

          await UserModel.updateOne(
            { razorpay_order_id: result.razorpay_order_id },
            updateData
          );

          res.send({ code: 200, message: "payment done" });
          console.log("Payment successful.");
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
