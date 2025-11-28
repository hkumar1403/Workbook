const express = require("express");
const router = express.Router();
const Workbook = require("../models/Workbook");
const {
  getSheets,
  addSheet,
  renameSheet,
  deleteSheet,
} = require("../controllers/sheetController");


// ------------------ STATIC ROUTES FIRST ------------------ //

// CREATE a new workbook
router.post("/", async (req, res) => {
  try {
    const name = req.body.name || "New Workbook";

    const workbook = await Workbook.create({
      name,
      sheets: ["Sheet1"],
      cells: { Sheet1: {} },
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
    // Find the most recently created workbook
    let workbook = await Workbook.findOne({}).sort({ createdAt: -1 });

    // If no workbook exists, create one
    if (!workbook) {
      workbook = await Workbook.create({
        name: "Workbook1",
        sheets: ["Sheet1"],
        cells: { Sheet1: {} },
      });
    }

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


// ------------------ DYNAMIC ROUTES LAST ------------------ //

// GET sheets for a workbook
router.get("/:workbookId/sheets", getSheets);


module.exports = router;
