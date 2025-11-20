module.exports = function MIN(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  const parts = inside.split(",").map((p) => p.trim().toUpperCase());
  let numbers = [];

  for (let p of parts) {
    // Raw number
    if (!isNaN(Number(p))) {
      numbers.push(Number(p));
      continue;
    }

    // Range like A1:B5
    if (p.includes(":")) {
      const expanded = expandRange(p);
      expanded.forEach((id) => {
        const v = resolveCellValue(id, allCells, cache);
        numbers.push(Number(v) || 0);
      });
    } else {
      // Single cell reference
      const v = resolveCellValue(p, allCells, cache);
      numbers.push(Number(v) || 0);
    }
  }

  if (numbers.length === 0) return 0;

  return Math.max(...numbers);
};
