// functions/exact.js
// EXACT(a, b) → TRUE if both values match EXACTLY (case-sensitive)

module.exports = function EXACT(inside, allCells, cache, resolveCellValue) {
  const parts = inside.split(",").map((p) => p.trim());
  if (parts.length < 2) return false;

  let [left, right] = parts;

  function resolve(val) {
    // If numeric return number as string
    if (!isNaN(Number(val))) {
      return String(Number(val));
    }
    // If quoted string return raw inside text
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      return val.slice(1, -1);
    }
    // Otherwise resolve cell
    return String(resolveCellValue(val, allCells, cache));
  }

  const leftVal = resolve(left);
  const rightVal = resolve(right);

  return leftVal === rightVal ? "TRUE" : "FALSE";
};
