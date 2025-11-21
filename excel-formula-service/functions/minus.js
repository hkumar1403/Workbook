module.exports = function MINUS(inside, allCells, cache, resolveCellValue) {
  // Split arguments: MINUS(A1, B1) → ["A1", "B1"]
  const parts = inside.split(",").map((p) => p.trim());

  // MINUS requires at least 2 parameters
  if (parts.length < 2) return 0;

  // Resolve first value (left side)
  const first = parts[0];
  let total = isNaN(Number(first))
    ? Number(resolveCellValue(first.toUpperCase(), allCells, cache)) || 0
    : Number(first);

  // Subtract each remaining argument from the first
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const value = isNaN(Number(p))
      ? Number(resolveCellValue(p.toUpperCase(), allCells, cache)) || 0
      : Number(p);

    total -= value;
  }

  return total;
};
