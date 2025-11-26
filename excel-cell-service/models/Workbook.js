const mongoose = require("mongoose");

const WorkbookSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Workbook1" },

    // Array of sheet names: ["Sheet1", "Sheet2", ...]
    sheets: {
      type: [String],
      default: ["Sheet1"],
    },

    // Map of sheetName -> cells object
    // {
    //   "Sheet1": { "A1": "value", "B2": "=SUM(A1)" },
    //   "Sheet2": { "A1": "test" }
    // }
    cells: {
      type: Map,
      of: {
        type: Map,
        of: String,
      },
      default: {},
    },

    createdAt: { type: Date, default: Date.now },
  }
);

module.exports =
  mongoose.models.Workbook || mongoose.model("Workbook", WorkbookSchema);
