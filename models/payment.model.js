const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  payment_link: { type: String },
  status: { type: String, default: 'pending' },
  payment_response: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);