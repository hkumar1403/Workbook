const express = require("express");
const router = express.Router();
const { saveCell, getSheet, getWorkbookCells } = require("../controllers/cellController");
const mongoose = require("mongoose");

// Helper to check if string is a valid MongoDB ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}

// POST /cells/:sheetId/:cellId - Save a cell value
// This route must come FIRST to avoid conflicts with GET /:id
router.post("/:sheetId/:cellId", saveCell);

// GET /cells/:id - Route handler that distinguishes between workbookId and sheetId
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  // If it's a valid ObjectId, treat it as workbookId
  if (isValidObjectId(id)) {
    req.params.workbookId = id;
    return getWorkbookCells(req, res);
  } else {
    // Otherwise, treat it as sheetId
    req.params.sheetId = id;
    return getSheet(req, res);
  }
});

module.exports = router;
