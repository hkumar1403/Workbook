const Workbook = require("../models/Workbook");

// GET all sheets for a workbook
exports.getSheets = async (req, res) => {
  try {
    const wb = await Workbook.findById(req.params.id);

    if (!wb) return res.status(404).json({ error: "Workbook not found" });

    res.json(wb.sheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD a sheet to a workbook
exports.addSheet = async (req, res) => {
  try {
    const wb = await Workbook.findById(req.params.id);

    if (!wb) return res.status(404).json({ error: "Workbook not found" });

    const { sheetName } = req.body;

    wb.sheets.push(sheetName);
    await wb.save();

    res.json(wb.sheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
