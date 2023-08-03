const mongoose = require("mongoose");

module.exports = mongoose.model("Payment", {
  razorpay_order_id: {
    type: String,
  },
  user_email: {
    type: String,
  },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },

  PAYMENT: {
    type: String,
  },
});
