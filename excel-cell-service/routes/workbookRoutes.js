const express = require("express");
const router = express.Router();
const Workbook = require("../models/Workbook");
const {
  getSheets,
  addSheet,
  renameSheet,
  deleteSheet,
  addColumn,
} = require("../controllers/sheetController");

// ------------------ STATIC ROUTES FIRST ------------------ //

// CREATE a new workbook
router.post("/", async (req, res) => {
  try {
    const name = req.body.name || "New Workbook";

    // Ensure new workbooks use proper Map structures
    const cells = new Map();
    cells.set("Sheet1", new Map());

    const sheetMeta = new Map();
    sheetMeta.set("Sheet1", { rows: 1000, columns: 26 });

    const workbook = await Workbook.create({
      name,
      sheets: ["Sheet1"],
      cells,
      sheetMeta,
    });

    res.json(workbook);
  } catch (err) {
    console.error("Create workbook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all workbooks
router.get("/", async (req, res) => {
  try {
    const workbooks = await Workbook.find({});
    res.json(workbooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INIT workbook - Get or create last workbook
router.get("/init", async (req, res) => {
  try {
    // Always try to find the most recently created workbook first.
    let workbook = await Workbook.findOne({}).sort({ createdAt: -1 });

    if (!workbook) {
      // No workbook exists yet → create a brand new one with the required defaults.
      const cells = new Map();
      cells.set("Sheet1", new Map());

      const sheetMeta = new Map();
      sheetMeta.set("Sheet1", { rows: 1000, columns: 26 });

      workbook = await Workbook.create({
        name: "Workbook1",
        sheets: ["Sheet1"],
        cells,
        sheetMeta,
        createdAt: Date.now(),
      });
    } else {
      // Ensure we always have at least "Sheet1" and matching maps.

      // Ensure sheet list exists and contains "Sheet1"
      if (!Array.isArray(workbook.sheets) || workbook.sheets.length === 0) {
        workbook.sheets = ["Sheet1"];
      } else if (!workbook.sheets.includes("Sheet1")) {
        workbook.sheets.unshift("Sheet1");
      }

      // Ensure cells map exists and has entry for "Sheet1"
      if (!workbook.cells || !(workbook.cells instanceof Map)) {
        workbook.cells = new Map();
      }
      if (!workbook.cells.has("Sheet1")) {
        workbook.cells.set("Sheet1", new Map());
      }

      // Ensure sheetMeta map exists and has entry for "Sheet1"
      if (!workbook.sheetMeta || !(workbook.sheetMeta instanceof Map)) {
        workbook.sheetMeta = new Map();
      }
      if (!workbook.sheetMeta.has("Sheet1")) {
        workbook.sheetMeta.set("Sheet1", { rows: 1000, columns: 26 });
      }

      workbook.markModified("cells");
      workbook.markModified("sheetMeta");
      await workbook.save();
    }

    // Frontend currently expects workbookId; keep response shape stable.
    res.json({ workbookId: workbook._id.toString() });
  } catch (err) {
    console.error("Init workbook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------ SHEET MODIFICATION ROUTES ------------------ //

router.put("/:workbookId/sheets/rename", renameSheet);
router.delete("/:workbookId/sheets/:sheetName", deleteSheet);

router.post("/:workbookId/sheets", addSheet);
router.post("/:workbookId/sheets/:sheetName/import", async (req, res) => {
  return require("../controllers/sheetController").importSheet(req, res);
});

// ADD COLUMN to a sheet
router.post("/:workbookId/sheets/:sheetName/columns", addColumn);

// ------------------ DYNAMIC ROUTES LAST ------------------ //

// GET sheets for a workbook
router.get("/:workbookId/sheets", getSheets);

// RENAME a workbook
router.put("/:workbookId/rename", async (req, res) => {
  try {
    const { workbookId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Workbook name required" });
    }

    const workbook = await Workbook.findById(workbookId);
    if (!workbook) return res.status(404).json({ error: "Workbook not found" });

    workbook.name = name;
    await workbook.save();

    res.json({ success: true, name });
  } catch (err) {
    console.error("Rename workbook error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/:workbookId", async (req, res) => {
  try {
    const wb = await Workbook.findById(req.params.workbookId);
    if (!wb) return res.status(404).json({ error: "Workbook not found" });
    res.json(wb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:workbookId", async (req, res) => {
  try {
    const { workbookId } = req.params;

    await Workbook.findByIdAndDelete(workbookId);
    // Or your DB-specific delete logic

    res.json({ success: true });
  } catch (err) {
    console.error("Delete workbook error:", err);
    res.status(500).json({ error: "Failed to delete workbook" });
  }
});

module.exports = router;
