const Workbook = require("../models/Workbook");

// GET all sheets for a workbook
exports.getSheets = async (req, res) => {
  try {
    const wb = await Workbook.findById(req.params.id);

    if (!wb) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    // Return array of sheet names
    const sheets = Array.isArray(wb.sheets) ? wb.sheets : [];
    res.json(sheets);
  } catch (err) {
    console.error("Error getting sheets:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADD a sheet to a workbook
exports.addSheet = async (req, res) => {
  try {
    const wb = await Workbook.findById(req.params.id);

    if (!wb) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    const { sheetName } = req.body;

    if (!sheetName) {
      return res.status(400).json({ error: "sheetName is required" });
    }

    // Add sheet name to array if not already present
    if (!wb.sheets.includes(sheetName)) {
      wb.sheets.push(sheetName);
      // Initialize empty cells map for the new sheet
      if (!wb.cells) {
        wb.cells = new Map();
      }
      wb.cells.set(sheetName, new Map());
    }

    await wb.save();

    // Return array of sheet names
    res.json(Array.isArray(wb.sheets) ? wb.sheets : []);
  } catch (err) {
    console.error("Error adding sheet:", err);
    res.status(500).json({ error: err.message });
  }
};
