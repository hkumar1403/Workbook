module.exports = function PRODUCT(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  const parts = inside.split(",").map((p) => p.trim().toUpperCase());
  let numbers = [];

  for (let p of parts) {

    // If it's a raw number
    if (!isNaN(Number(p))) {
      numbers.push(Number(p));
      continue;
    }

    // If it's a range like A1:B3
    if (p.includes(":")) {
      const expanded = expandRange(p);
      expanded.forEach((id) => {
        const v = resolveCellValue(id, allCells, cache);
        numbers.push(Number(v) || 0);
      });
      continue;
    }

    // Otherwise it's a single cell like A1
    const v = resolveCellValue(p, allCells, cache);
    numbers.push(Number(v) || 0);
  }

  // Multiply all values
  return numbers.reduce((a, b) => a * b, 1);
};
