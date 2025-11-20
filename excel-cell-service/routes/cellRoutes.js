const express = require("express");
const router = express.Router();
const { saveCell, getSheet } = require("../controllers/cellController");

router.post("/:sheetId/:cellId", saveCell);
router.get("/:sheetId", getSheet);

module.exports = router;
