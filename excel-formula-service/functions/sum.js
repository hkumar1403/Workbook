module.exports = function SUM(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  const parts = inside.split(",").map((p) => p.trim().toUpperCase());
  let numbers = [];
  for (let p of parts) {
    if (!isNaN(Number(p))) {
      numbers.push(Number(p));
      continue;
    }
    if (p.includes(":")) {
      //handle ranges like A1:B3
      const expanded = expandRange(p);
      expanded.forEach((id) => {
        const v = resolveCellValue(id, allCells, cache);
        numbers.push(Number(v) || 0);
      });
    } else {
      const v = resolveCellValue(p, allCells, cache);
      numbers.push(Number(v) || 0);
    }
  }
  return numbers.reduce((a, b) => a + b, 0);
};