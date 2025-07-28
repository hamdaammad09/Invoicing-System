const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  id:{type :String,  unique:true ,  autoIncrement:true},
  name: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  company: { type: String },
  buyerSTRN: { type: String }, // Buyer STRN
  buyerNTN: { type: String }, // Buyer NTN
  email: String,
  phone: String,
  address: String,
  truckNo: { type: String }, // Truck Number
  registeredDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Client', clientSchema);
