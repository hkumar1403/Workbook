const mongoose = require("mongoose");

const workbookSchema = new mongoose.Schema({
  sheets: {
    type: [String],
    default: ["Sheet1"],
  },
  cells: {
    type: Map,
    of: String,
    default: {},
  }
});

module.exports = mongoose.model("Workbook", workbookSchema);
