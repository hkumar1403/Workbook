const Workbook = require("../models/Workbook");

// GET /cells/:workbookId - Get all cells for the workbook's first sheet (or active sheet)
// Also supports GET /cells/:workbookId?sheet=SheetName
exports.getWorkbookCells = async (req, res) => {
  try {
    const { workbookId } = req.params;
    const { sheet } = req.query; // Optional sheet query parameter

    if (!workbookId) {
      return res.status(400).json({ error: "workbookId is required" });
    }

    const workbook = await Workbook.findById(workbookId);

    if (!workbook) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    // Determine which sheet to use
    let sheetName;
    if (sheet) {
      // Use specified sheet if it exists
      if (workbook.sheets.includes(sheet)) {
        sheetName = sheet;
      } else {
        return res.status(404).json({ error: `Sheet "${sheet}" not found` });
      }
    } else {
      // Default to first sheet
      sheetName = workbook.sheets && workbook.sheets.length > 0 
        ? workbook.sheets[0] 
        : "Sheet1";
    }

    // Get cells for this sheet
    const sheetCells = workbook.cells?.get(sheetName);

    // Convert Map to plain object
    const cellsObject = {};
    if (sheetCells && sheetCells instanceof Map) {
      sheetCells.forEach((value, key) => {
        cellsObject[key] = value;
      });
    }

    res.json(cellsObject);
  } catch (err) {
    console.error("Error getting workbook cells:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /cells/:workbookId/:sheetName/:cellId - Save a cell value
exports.saveCell = async (req, res) => {
  try {
    const { workbookId, sheetName, cellId } = req.params;
    const { rawValue } = req.body;

    // Validate required fields
    if (!workbookId || !sheetName || !cellId) {
      return res.status(400).json({ error: "workbookId, sheetName, and cellId are required" });
    }

    // Find workbook by ID
    let workbook = await Workbook.findById(workbookId);

    if (!workbook) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    // Ensure sheet exists in workbook
    if (!workbook.sheets.includes(sheetName)) {
      return res.status(404).json({ error: "Sheet not found in workbook" });
    }

    // Ensure cells map exists
    if (!workbook.cells) {
      workbook.cells = new Map();
    }

    // Get or create cells map for this sheet
    let sheetCells = workbook.cells.get(sheetName);
    if (!sheetCells) {
      sheetCells = new Map();
      workbook.cells.set(sheetName, sheetCells);
    }

    // Update cell value
    sheetCells.set(cellId, rawValue || "");

    workbook.markModified("cells");
    await workbook.save();

    // Return success response
    return res.status(200).json({ 
      success: true,
      workbookId: workbookId,
      sheetName: sheetName,
      cellId: cellId,
      rawValue: rawValue || ""
    });
  } catch (err) {
    console.error("Error saving cell:", err);
    return res.status(500).json({ error: err.message || "Failed to save cell" });
  }
};

// GET /cells/:sheetId - Get all cells for a specific sheet
exports.getSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;

    if (!sheetId) {
      return res.status(400).json({ error: "sheetId is required" });
    }

    // Find workbook that contains this sheet
    const workbook = await Workbook.findOne({ sheets: { $in: [sheetId] } });

    if (!workbook) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    // Get cells for this sheet
    const sheetCells = workbook.cells?.get(sheetId);

    // Convert Map to plain object
    const cellsObject = {};
    if (sheetCells && sheetCells instanceof Map) {
      sheetCells.forEach((value, key) => {
        cellsObject[key] = value;
      });
    }

    res.json(cellsObject);
  } catch (err) {
    console.error("Error getting sheet cells:", err);
    res.status(500).json({ error: err.message });
  }
};
