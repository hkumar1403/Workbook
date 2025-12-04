const mongoose = require("mongoose");

const SheetMetaSchema = new mongoose.Schema(
  {
    // numeric column count
    columns: { type: Number, default: 26 },
    rows: { type: Number, default: 1000 },
    // array of numbers storing each column width in pixels
    columnWidths: {
      type: [Number],
      default: function () {
        // default array length matches default columns
        return Array(26).fill(120);
      },
    },
    // explicit column identifiers, e.g. ["A","B","C",...]
    columnLabels: {
      type: [String],
      default: function () {
        return [];
      }, // generated lazily in controllers when missing
    },
    // you can add other per-sheet settings here later (hidden columns, frozen rows, etc.)
  },
  { _id: false }
);

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

    // ---- NEW: per-sheet metadata (columns, widths, rows, etc.)
    // Map where key = sheetName (e.g. "Sheet1"), value = SheetMetaSchema
    // ---- NEW: per-sheet metadata (columns, widths, rows, etc.)
    sheetMeta: {
      type: Map,
      of: new mongoose.Schema(
        {
          columns: { type: Number, default: 26 },
          rows: { type: Number, default: 1000 },

          // Array of column labels: ["A","B","C", ...]
          columnLabels: {
            type: [String],
            default: undefined,
          },

          // Array of widths for each column
          columnWidths: {
            type: [Number],
            default: function () {
              return Array(26).fill(120); // default width 120px
            },
          },
        },
        { _id: false }
      ),
      default: {},
    },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false } // keep empty maps as empty objects
);

module.exports =
  mongoose.models.Workbook || mongoose.model("Workbook", WorkbookSchema);
