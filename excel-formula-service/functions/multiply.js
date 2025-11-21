// functions/multiply.js
// MULTIPLY(a, b, c...) → a * b * c * …

module.exports = function MULTIPLY(inside, allCells, cache, resolveCellValue) {
  // Convert: "A1, B1, 10" → ["A1", "B1", "10"]
  const parts = inside.split(",").map((p) => p.trim());

  if (parts.length < 2) return 0;

  let total = 1;

  for (let p of parts) {
    let value;

    // If it's a number like "5"
    if (!isNaN(Number(p))) {
      value = Number(p);
    } else {
      // It's a cell reference, like A1
      value = Number(resolveCellValue(p.toUpperCase(), allCells, cache)) || 0;
    }

    total *= value;
  }

  return total.toFixed(2);
};
