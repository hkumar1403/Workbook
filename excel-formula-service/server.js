const express = require("express");
const cors = require("cors");
const evaluateFormula = require("./evaluateFormula");

const app = express();

// Allow requests from your Next.js frontend
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// MAIN API ENDPOINT

app.post("/evaluate", (req, res) => {
  try {
    
    const { cellId, rawValue, allCells } = req.body;
    const upperCasedFormula = rawValue;
    const result = evaluateFormula(upperCasedFormula, allCells);

    return res.json({ result });
  } catch (err) {
    console.error("Formula error:", err);
    return res.status(400).json({ error: "Invalid formula" });
  }
});

const PORT = 5002;

app.listen(PORT, () =>
  console.log(`📘 Formula service running on port ${PORT}`)
);
