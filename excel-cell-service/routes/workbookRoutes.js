const express = require("express");
const router = express.Router();
const Workbook = require("../models/Workbook");
const { getSheets, addSheet } = require("../controllers/sheetController");

// ✅ FIRST: INIT ROUTE
router.get("/init", async (req, res) => {
  try {
    let workbook = await Workbook.findOne({});

    if (!workbook) {
      workbook = await Workbook.create({
        sheets: ["Sheet1"],
        cells: {}
      });
    }

    res.json({ workbookId: workbook._id });
  } catch (err) {
    console.error("Workbook init error:", err);
    res.status(500).json({ error: err.message });
  }
});

// NEXT: Sheet routes
router.get("/:id/sheets", getSheets);
router.post("/:id/sheets", addSheet);

module.exports = router;
