const mongoose = require('mongoose');
const registerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phoneNumber: String,
  },{collection:"registration"});
  
  const User = mongoose.model('Registration', registerSchema);
  module.exports = User;