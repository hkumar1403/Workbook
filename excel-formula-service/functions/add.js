module.exports = function ADD(
  inside,
  allCells,
  cache,
  resolveCellValue
) {
  // Split the arguments by comma and trim whitespace
  const parts = inside.split(",").map((p) => p.trim());

  // ADD requires EXACTLY 2 arguments
  if (parts.length !== 2) {
    return 'Error';
  }

  let total = 0;

  for (let arg of parts) {
    // 1) If it's a valid number, convert and add
    if (!isNaN(Number(arg))) {
      total += Number(arg);
      continue;
    }

    // 2) If it matches a cell reference (A1, B5...)
    if (/^[A-Z]+\d+$/i.test(arg)) {
      const id = arg.toUpperCase();
      const value = resolveCellValue(id, allCells, cache);
      total += Number(value) || 0;
      continue;
    }

    // 3) Ranges are NOT allowed in ADD
    if (arg.includes(":")) {
      return 'Error';
    }

    // 4) If we reach here → invalid argument
    console.error("❌ Invalid ADD() argument:", arg);
    return 'Error';
  }

  return total;
};
