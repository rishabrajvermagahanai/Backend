const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const userController = require("./controller/user");
const paymentController=require('./controller/paymentController')

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// mongoose.connect('mongodb://localhost:27017/test', (err) => {
//     if (err) {
//         console.log('DB Err.')
//     } else {
//         console.log('DB Connected.')
//     }
// });
mongoose
  .connect('mongodb://127.0.0.1:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

  
app.post("/signup", userController.signup);
app.post("/signin", userController.signin);
app.post("/submit-otp", userController.submitotp);
app.post("/send-otp", userController.sendotp);

              
app.post('/orders',paymentController.orders)
app.post('/verify',paymentController.verify)


app.listen(5000, () => {
  console.log(`Backend Running At Port 5000`);
});
