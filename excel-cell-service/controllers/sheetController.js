const Workbook = require("../models/Workbook");

// Helper to convert 1-based index -> Excel column letters ("A", "B", ..., "AA", ...)
function colToLetter(num) {
  let result = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

function generateColumnLabels(count) {
  const labels = [];
  const safeCount = count && count > 0 ? count : 26;
  for (let i = 1; i <= safeCount; i++) {
    labels.push(colToLetter(i));
  }
  return labels;
}

// GET all sheets for a workbook
exports.getSheets = async (req, res) => {
  try {
    const { workbookId } = req.params;

    const wb = await Workbook.findById(workbookId);

    if (!wb) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    let metaUpdated = false;

    const sheets = (wb.sheets || []).map((name) => {
      // Ensure we have a metadata entry for this sheet
      if (!wb.sheetMeta || !(wb.sheetMeta instanceof Map)) {
        wb.sheetMeta = new Map();
      }

      let meta = wb.sheetMeta.get(name);
      if (!meta) {
        meta = { columns: 26, rows: 1000 };
      }

      // Lazily generate columnLabels if missing so they persist
      if (!Array.isArray(meta.columnLabels) || meta.columnLabels.length === 0) {
        const count =
          typeof meta.columns === "number" && meta.columns > 0
            ? meta.columns
            : 26;
        meta.columnLabels = generateColumnLabels(count);
        meta.columns = count;
        wb.sheetMeta.set(name, meta);
        metaUpdated = true;
      }

      return {
        name,
        columns: meta.columns, // 👉 number of columns (27, 28, ...)
        columnLabels: meta.columnLabels, // 👉 actual labels ["A","B",...]
      };
    });
    wb.markModified("sheetMeta");
    await wb.save();

    res.json(sheets);
  } catch (err) {
    console.error("Error getting sheets:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADD a sheet to a workbook
exports.addSheet = async (req, res) => {
  try {
    const { workbookId } = req.params;
    const wb = await Workbook.findById(workbookId);

    if (!wb) {
      return res.status(404).json({ error: "Workbook not found" });
    }

    const { sheetName } = req.body;

    if (!sheetName) {
      return res.status(400).json({ error: "sheetName is required" });
    }

    if (!wb.sheets.includes(sheetName)) {
      wb.sheets.push(sheetName);

      // Ensure cells is a Map
      if (!wb.cells || !(wb.cells instanceof Map)) {
        wb.cells = new Map();
      }
      wb.cells.set(sheetName, new Map());

      // Ensure sheetMeta is a Map
      if (!wb.sheetMeta || !(wb.sheetMeta instanceof Map)) {
        wb.sheetMeta = new Map();
      }

      const meta = {
        rows: 1000,
        columns: 26,
        columnLabels: generateColumnLabels(26),
      };

      wb.sheetMeta.set(sheetName, meta);
    }

    wb.markModified("cells");
    wb.markModified("sheetMeta");

    await wb.save();

    res.json(wb.sheets);
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

    // Ensure cells is a Map
    if (!workbook.cells || !(workbook.cells instanceof Map)) {
      workbook.cells = new Map();
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
    if (!workbook.cells || !(workbook.cells instanceof Map)) {
      workbook.cells = new Map();
    }
    const sheetMap = workbook.cells.get(oldName);
    if (sheetMap) {
      workbook.cells.set(newName, sheetMap);
      workbook.cells.delete(oldName);
    }

    // 🔥 Rename metadata as well
    if (!workbook.sheetMeta || !(workbook.sheetMeta instanceof Map)) {
      workbook.sheetMeta = new Map();
    }
    const meta = workbook.sheetMeta.get(oldName);
    if (meta) {
      workbook.sheetMeta.set(newName, meta);
      workbook.sheetMeta.delete(oldName);
    }

    workbook.markModified("cells");
    workbook.markModified("sheetMeta");

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
    if (workbook.cells && workbook.cells instanceof Map) {
      workbook.cells.delete(sheetName);
      workbook.markModified("cells");
    }

    // Remove metadata for this sheet if present
    if (workbook.sheetMeta && workbook.sheetMeta instanceof Map) {
      workbook.sheetMeta.delete(sheetName);
      workbook.markModified("sheetMeta");
    }

    await workbook.save();

    res.json(workbook.sheets);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Replace your existing addColumn with this function

exports.addColumn = async (req, res) => {
  try {
    const { workbookId, sheetName } = req.params;
    const { index, direction } = req.body; // 👈 get insertion index

    const workbook = await Workbook.findById(workbookId);
    if (!workbook) return res.status(404).json({ error: "Workbook not found" });

    if (!workbook.sheetMeta || !(workbook.sheetMeta instanceof Map)) {
      workbook.sheetMeta = new Map();
    }

    let meta = workbook.sheetMeta.get(sheetName);
    if (!meta) {
      meta = {
        rows: 1000,
        columns: 26,
        columnLabels: generateColumnLabels(26),
      };
    }

    if (!Array.isArray(meta.columnLabels)) {
      meta.columnLabels = generateColumnLabels(meta.columns || 26);
    }

    // Determine real insertion position
    let insertAt = index;
    if (direction === "right") insertAt = index + 1;
    if (insertAt < 0) insertAt = 0;
    if (insertAt > meta.columnLabels.length) insertAt = meta.columnLabels.length;

    // Insert a new label at the correct position
    const newLabel = colToLetter(meta.columnLabels.length + 1);
    meta.columnLabels.splice(insertAt, 0, newLabel);

    // Recalculate ALL labels (A B C D ... AA AB ...)
    meta.columnLabels = generateColumnLabels(meta.columnLabels.length);
    meta.columns = meta.columnLabels.length;

    workbook.sheetMeta.set(sheetName, meta);
    workbook.markModified("sheetMeta");
    await workbook.save();

    res.json({ columns: meta.columnLabels });
  } catch (err) {
    console.error("Add column error:", err);
    res.status(500).json({ error: err.message });
  }
};
