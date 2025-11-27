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

// body: { cells: { A1: "x", B1: "y", ... }, mode: "overwrite" | "append" }
exports.importSheet = async (req, res) => {
  try {
    const { workbookId, sheetName } = req.params;
    const { cells } = req.body;

    if (!cells || typeof cells !== "object") {
      return res.status(400).json({ error: "Invalid cells data" });
    }

    const workbook = await Workbook.findById(workbookId);
    if (!workbook) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    // Create sheet Map if missing
    if (!workbook.cells.has(sheetName)) {
      workbook.cells.set(sheetName, new Map());
    }

    const sheetMap = workbook.cells.get(sheetName); // Map of cells

    // Replace entire sheet
    const newSheetMap = new Map();

    for (const [cellId, value] of Object.entries(cells)) {
      newSheetMap.set(cellId, value);
    }

    // Save the sheet map correctly
    workbook.cells.set(sheetName, newSheetMap);

    // This ensures Mongoose notices the Map update
    workbook.markModified("cells");

    await workbook.save();

    return res.json({ success: true, cells: Object.fromEntries(newSheetMap) });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ error: "Server error while importing CSV" });
  }
};
