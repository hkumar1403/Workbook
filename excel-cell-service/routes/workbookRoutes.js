const express = require("express");
const router = express.Router();
const Workbook = require("../models/Workbook");
const {
  getSheets,
  addSheet,
  renameSheet,
  deleteSheet,
} = require("../controllers/sheetController");

router.put("/:workbookId/sheets/rename", renameSheet);
router.delete("/:workbookId/sheets/:sheetName", deleteSheet);
// ✅ FIRST: INIT ROUTE
router.get("/init", async (req, res) => {
  try {
    let workbook = await Workbook.findOne({});

    if (!workbook) {
      // Create new workbook - Mongoose will handle Map initialization
      workbook = await Workbook.create({
        sheets: ["Sheet1"],
      });

      // Initialize cells map for Sheet1 if not already initialized
      if (!workbook.cells) {
        workbook.cells = new Map();
      }
      if (!workbook.cells.has("Sheet1")) {
        workbook.cells.set("Sheet1", new Map());
      }
      await workbook.save();
    } else {
      // Ensure first sheet exists in cells map
      if (workbook.sheets && workbook.sheets.length > 0) {
        const firstSheet = workbook.sheets[0];
        if (!workbook.cells) {
          workbook.cells = new Map();
        }
        if (!workbook.cells.has(firstSheet)) {
          workbook.cells.set(firstSheet, new Map());
          await workbook.save();
        }
      }
    }

    res.json({ workbookId: workbook._id.toString() });
  } catch (err) {
    console.error("Workbook init error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Sheet routes
router.get("/:id/sheets", getSheets);
router.post("/:workbookId/sheets", addSheet);
// POST /workbook/:workbookId/sheets/:sheetName/import
router.post("/:workbookId/sheets/:sheetName/import", async (req, res) => {
  // delegate to controller
  return require("../controllers/sheetController").importSheet(req, res);
});

module.exports = router;
