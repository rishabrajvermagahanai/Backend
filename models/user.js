const mongoose = require('mongoose');

module.exports = mongoose.model('User',
 {  email: String,
    isVerify: String, 
    password: String,
    name:String,
    mobile: Number, 
    otp: Number, 
    name: String, 
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    PAYMENT:String,
});

