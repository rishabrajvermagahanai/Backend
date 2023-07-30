const Razorpay = require("razorpay");
const RAZORPAY_KEY = "rzp_test_JEWW6lKdPr0kPa";
const RAZORPAY_SECRET = "QWV1OjVPWTRPGwdZRF8za9on";
var crypto = require("crypto");

module.exports.orders = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: RAZORPAY_KEY,
      key_secret: RAZORPAY_SECRET,
    });

    const options = {
      amount: req.body.amount * 100, // amount in smallest currency unit
      currency: "INR",
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
   // console.log(order);
  } catch (error) {
    res.status(500).send(error);
  }
};



module.exports.verify = async(req,res) => {
   
try{
    let body =await (req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id);

    var expectedSignature =await crypto.createHmac('sha256', RAZORPAY_SECRET).update(body.toString()).digest('hex');
   }catch(error){
    res.status(500).send(error);
   }

    if (expectedSignature === req.body.response.razorpay_signature) {
        res.send({ code: 200, message: 'Sign Valid' });

        //database comes here
        console.log("data can be store in data base WHEN payment is success :--"+req.body)
    } else {
        console.log("INvalid")
        res.send({ code: 500, message: 'Sign Invalid' });
    }
};