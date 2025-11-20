const mongoose = require("mongoose");

const cellSchema = new mongoose.Schema({
  sheetId: { type: String, required: true },
  cellId: { type: String, required: true },
  rawValue: { type: String, default: "" },
});

module.exports = mongoose.model("Cell", cellSchema);
