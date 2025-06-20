const mongoose = require("mongoose");
const fileDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  //file:""
},{Collection:"files"});

const File = mongoose.model("files", fileDetailSchema);

module.exports = File;
