const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  id:{type :String,  unique:true ,  autoIncrement:true},
  name: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  company: { type: String },
  ntn: { type: String },
  strn: { type: String },
  email: String,
  phone: String,
  address: String,
  registeredDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Client', clientSchema);
