const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config({ path: "config/config.env" });
const userController = require("./controller/user");
const paymentController = require("./controller/paymentController");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error in connecting to MongoDB:", err));


app.post("/signup", userController.signup);
app.post("/signin", userController.signin);
app.post("/submit-otp", userController.submitotp);
app.post("/send-otp", userController.sendotp);


app.post("/orders", paymentController.orders);
app.post("/verify", paymentController.verify);
app.get("/getkey", (req, res) =>
  res.status(200).json({ key: process.env.KEY })
);



app.listen(5000, () => {
  console.log(`Backend Running At Port 5000`);
});
