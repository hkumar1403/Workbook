const { Parser } = require("expr-eval");
const { expandRange } = require("./helpers");

// Resolve a cell's numeric value (handles formulas recursively)
function resolveCellValue(cellId, allCells, cache) {
  if (cache[cellId] !== undefined) return cache[cellId];

  const raw = allCells[cellId];

  if (!raw) {
    cache[cellId] = 0;
    return 0;
  }

  // Raw plain number
  if (!String(raw).startsWith("=")) {
    const num = Number(raw);
    cache[cellId] = isNaN(num) ? 0 : num;
    return cache[cellId];
  }

  // Raw is a formula → evaluate it recursively
  const result = evaluateFormula(raw, allCells, cache);
  cache[cellId] = result;

  return result;
}

function evaluateFormula(rawValue, allCells, cache = {}) {
  if (!rawValue || !rawValue.startsWith("=")) {
    const num = Number(rawValue);
    return isNaN(num) ? 0 : num;
  }

  rawValue = rawValue.toUpperCase();
  let formula = rawValue.slice(1); //REMOVE THE INITIAL "="

  // Handle functions: SUM(), AVERAGE(), MIN(), MAX()
  formula = formula.replace(
    /(SUM|AVERAGE|MIN|MAX)\(([^)]*)\)/gi,
    (match, fn, inside) => {
      const parts = inside.split(",").map((p) => p.trim());
      let numbers = [];

      for (let p of parts) {
        p = p.toUpperCase();
        if (p.includes(":")) {
          // Range: A1:A5
          const expanded = expandRange(p);
          expanded.forEach((id) => {
            const v = resolveCellValue(id, allCells, cache);
            numbers.push(Number(v) || 0);
          });
        } else {
          // Single cell: A1
          const v = resolveCellValue(p, allCells, cache);
          numbers.push(Number(v) || 0);
        }
      }

      fn = fn.toUpperCase();

      if (fn === "SUM") return numbers.reduce((a, b) => a + b, 0);
      if (fn === "AVERAGE")
        return numbers.length
          ? numbers.reduce((a, b) => a + b, 0) / numbers.length
          : 0;
      if (fn === "MIN") return Math.min(...numbers);
      if (fn === "MAX") return Math.max(...numbers);

      return 0;
    }
  );

  // Replace single cell refs like A1, B2, C10
  formula = formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, col, row) => {
    const id = col.toUpperCase() + row;
    const v = resolveCellValue(id, allCells, cache);
    return Number(v) || 0;
  });

  // Evaluate math safely with expr-eval
  const parser = new Parser();

  try {
    return parser.evaluate(formula);
  } catch {
    return 0;
  }
}

module.exports = evaluateFormula;
