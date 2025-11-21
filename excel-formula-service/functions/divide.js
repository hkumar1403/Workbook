// functions/divide.js
// DIVIDE(a, b, c...) → (((a / b) / c) ...)

module.exports = function DIVIDE(inside, allCells, cache, resolveCellValue) {
  // Split into arguments
  const parts = inside.split(",").map((p) => p.trim());

  // Need at least 2 numbers
  if (parts.length < 2) return 0;

  // Resolve first value (numerator)
  const first = parts[0];
  let total = isNaN(Number(first))
    ? Number(resolveCellValue(first.toUpperCase(), allCells, cache)) || 0
    : Number(first);

  // Divide by all other values
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const value = isNaN(Number(p))
      ? Number(resolveCellValue(p.toUpperCase(), allCells, cache)) || 0
      : Number(p);

    // Handle divide-by-zero
    if (value === 0) return 0;

    total /= value;
  }

  return total.toFixed(2);
};
