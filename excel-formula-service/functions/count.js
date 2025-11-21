module.exports = function COUNT(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  const parts = inside.split(",").map((p) => p.trim());

  let count = 0;

  for (let p of parts) {
    const upper = p.toUpperCase();

    // 🔥 1. Ignore all quoted strings (single or double)
    if (
      (p.startsWith('"') && p.endsWith('"')) ||
      (p.startsWith("'") && p.endsWith("'"))
    ) {
      continue;
    }

    // 🔥 2. Ignore empty or weird garbage like "',", ".", "ABC!", "**"
    // Only allow raw numbers or valid cell refs or ranges
    const isRawNumber = /^-?\d+(\.\d+)?$/.test(p);
    const isRange = upper.includes(":");
    const isCell = /^[A-Z]+[0-9]+$/.test(upper);

    if (!isRawNumber && !isRange && !isCell) {
      // Not a valid number, not a range, not a cell → ignore it
      continue;
    }

    // ✔ 3. Raw number
    if (isRawNumber) {
      count++;
      continue;
    }

    // ✔ 4. Range like A1:B5
    if (isRange) {
      const expanded = expandRange(upper);
      expanded.forEach((id) => {
        const v = resolveCellValue(id, allCells, cache);
        if (typeof v === "number" && !isNaN(v)) count++;
      });
      continue;
    }

    // ✔ 5. Valid cell reference like A1
    if (isCell) {
      const v = resolveCellValue(upper, allCells, cache);
      if (typeof v === "number" && !isNaN(v)) count++;
      continue;
    }
  }

  return count;
};
