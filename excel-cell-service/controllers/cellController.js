const Cell = require("../models/Cell");

exports.saveCell = async (req, res) => {
  const { sheetId, cellId } = req.params;
  const { rawValue } = req.body;

  let cell = await Cell.findOne({ sheetId, cellId });

  if (!cell) {
    cell = new Cell({ sheetId, cellId, rawValue });
  } else {
    cell.rawValue = rawValue;
  }

  await cell.save();
  res.json({ success: true });
};

exports.getSheet = async (req, res) => {
  const { sheetId } = req.params;
  const cells = await Cell.find({ sheetId });

  const formatted = {};
  cells.forEach((c) => (formatted[c.cellId] = c.rawValue));

  res.json(formatted);
};
