const mongoose = require('mongoose');


module.exports = mongoose.model('User',
 { email: String, password: String, otp: Number });

