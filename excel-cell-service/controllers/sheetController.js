const Workbook = require("../models/Workbook");

// GET all sheets for a workbook
exports.getSheets = async (req, res) => {
  try {
    const workbookId = req.params.workbookId || req.params.id;
    const wb = await Workbook.findById(workbookId);

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
    const wb = await Workbook.findById(req.params.workbookId);


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

exports.renameSheet = async (req, res) => {
  try {
    const { workbookId } = req.params;
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res
        .status(400)
        .json({ error: "Old and new sheet names required" });
    }

    const workbook = await Workbook.findById(workbookId);
    if (!workbook) return res.status(404).json({ error: "Workbook not found" });

    // Validate sheet exists
    const index = workbook.sheets.indexOf(oldName);
    if (index === -1) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    // Prevent duplicates
    if (workbook.sheets.includes(newName)) {
      return res
        .status(400)
        .json({ error: "A sheet with that name already exists" });
    }

    // Rename in sheets array
    workbook.sheets[index] = newName;

    // Rename sheet in cells map
    const sheetMap = workbook.cells.get(oldName);
    if (sheetMap) {
      workbook.cells.set(newName, sheetMap);
      workbook.cells.delete(oldName);
    }

    workbook.markModified("cells"); // Important for Map updates

    await workbook.save();

    res.json(workbook.sheets);
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteSheet = async (req, res) => {
  try {
    const { workbookId, sheetName } = req.params;

    const workbook = await Workbook.findById(workbookId);
    if (!workbook) return res.status(404).json({ error: "Workbook not found" });

    if (!workbook.sheets.includes(sheetName)) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    // Prevent deleting the only sheet
    if (workbook.sheets.length === 1) {
      return res.status(400).json({ error: "Cannot delete the only sheet" });
    }

    // Remove sheet from array
    workbook.sheets = workbook.sheets.filter((s) => s !== sheetName);

    // Remove sheet data
    workbook.cells.delete(sheetName);
    workbook.markModified("cells");

    await workbook.save();

    res.json(workbook.sheets);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
