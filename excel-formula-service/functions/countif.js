// COUNTIF(range, criteria)
//
// range: A1:A5 or A1, A2, ...
// criteria: ">10", "<=5", "=hello", "hello", 10, A1
//
// Note: Criteria comparisons are case-insensitive for text (same as Excel)

module.exports = function COUNTIF(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  const parts = inside.split(",").map((p) => p.trim());

  if (parts.length < 2) return 0;

  let [rangeStr, criteria] = parts;

  // ----------------------------
  // 1️⃣ Parse the range
  // ----------------------------
  let cellIds = [];

  // Range case: A1:A5
  if (rangeStr.includes(":")) {
    cellIds = expandRange(rangeStr.toUpperCase());
  } else {
    // Single cell like A1
    cellIds = [rangeStr.toUpperCase()];
  }

  // ----------------------------
  // 2️⃣ Normalize and prepare criteria
  // ----------------------------

  // Remove quotes around criteria
  if (
    (criteria.startsWith('"') && criteria.endsWith('"')) ||
    (criteria.startsWith("'") && criteria.endsWith("'"))
  ) {
    criteria = criteria.slice(1, -1);
  }

  // Criterion may be a cell reference
  if (/^[A-Z]+\d+$/i.test(criteria)) {
    criteria = resolveCellValue(criteria, allCells, cache);
  }

  let operator = null;
  let critValue = criteria;

  // Detect operators (>, <, >=, <=, =, <>)
  criteria = String(criteria);
  const opMatch = String(criteria).match(/^(>=|<=|<>|>|<|=)(.+)$/);
  if (opMatch) {
    operator = opMatch[1];
    critValue = opMatch[2].trim();
  }

  // Convert criterion to number if it looks numeric
  if (!isNaN(Number(critValue))) {
    critValue = Number(critValue);
  }

  // Text criteria should be compared case-insensitively
  if (typeof critValue === "string") {
    critValue = critValue.toUpperCase();
  }

  // ----------------------------
  // 3️⃣ Evaluate all cells
  // ----------------------------
  let count = 0;

  for (let id of cellIds) {
    let val = resolveCellValue(id, allCells, cache);

    // Convert val for comparison
    let compareVal = val;

    if (typeof compareVal === "string") compareVal = compareVal.toUpperCase();
    if (!isNaN(Number(compareVal))) compareVal = Number(compareVal);

    // ----------------------------
    // 4️⃣ Perform comparison
    // ----------------------------
    let match = false;

    if (operator) {
      switch (operator) {
        case ">":
          match = Number(compareVal) > Number(critValue);
          break;
        case "<":
          match = Number(compareVal) < Number(critValue);
          break;
        case ">=":
          match = Number(compareVal) >= Number(critValue);
          break;
        case "<=":
          match = Number(compareVal) <= Number(critValue);
          break;
        case "=":
          match = compareVal == critValue;
          break;
        case "<>":
          match = compareVal != critValue;
          break;
      }
    } else {
      // No operator, just match equality (Excel default)
      match = compareVal == critValue;
    }

    if (match) count++;
  }

  return count;
};
