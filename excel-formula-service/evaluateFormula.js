// excel-formula-service/evaluateFormula.js
const { Parser } = require("expr-eval");
const { expandRange } = require("./helpers");

// import centralized formula registry (each function is in /functions/*.js)
const functionHandlers = require("./functions");

/**
 * Resolve a cell's numeric value (handles formulas recursively)
 * Uses `cache` to store computed values and a sentinel to detect circular refs.
 */
function resolveCellValue(cellId, allCells, cache) {
  // 1) Circular reference detection: if this cell is already being evaluated, stop.
  if (cache[cellId] === Symbol.for("IN_PROGRESS")) {
    console.error(`⛔ Circular reference detected when resolving ${cellId}`);
    return 0;
  }

  // 2) Return cached value if available
  if (cache[cellId] !== undefined) {
    return cache[cellId];
  }

  // 3) Get raw stored value for the cell (may be undefined)
  const raw = allCells[cellId];

  // 4) If no value, treat as 0
  if (!raw) {
    cache[cellId] = 0;
    return 0;
  }

  // 5) If raw is not a formula (doesn't start with "="), parse as number
  if (!String(raw).startsWith("=")) {
    const num = Number(raw);
    cache[cellId] = isNaN(num) ? 0 : num;
    return cache[cellId];
  }

  // 6) Mark as in-progress then evaluate formula recursively
  cache[cellId] = Symbol.for("IN_PROGRESS");
  try {
    console.log(`🔁 Evaluating formula in ${cellId}: ${raw}`);
    const result = evaluateFormula(raw, allCells, cache);
    cache[cellId] = result;
    return result;
  } catch (err) {
    console.error(`Formula evaluation error in ${cellId}:`, err);
    cache[cellId] = 0; // fail-safe
    return 0;
  }
}

/**
 * Evaluate a formula string like "=A1 + SUM(B1:B3) * 2"
 * - rawValue: string starting with "="
 * - allCells: object map { "A1": "10", "B1": "=SUM(...)" ... }
 * - cache: object reused across a top-level evaluate call to memoize results
 */
function evaluateFormula(rawValue, allCells, cache = {}) {
  // If not a formula, return primitive number
  if (!rawValue || !rawValue.startsWith("=")) {
    const num = Number(rawValue);
    return isNaN(num) ? 0 : num;
  }

  // Normalize to uppercase so functions and A1 refs are case-insensitive.
  // Keep original whitespace inside function args — handlers should trim.
  rawValue = rawValue.toUpperCase();

  // Remove leading '=' to create the math expression we will evaluate.
  // We'll replace function calls with numeric strings and top-level cell refs with numbers.
  let formula = rawValue.slice(1);

  // 1) Function dispatch: find function calls like SUM(...), IF(...), COUNT(...).
  //    We replace each call with the handler's computed numeric/string result.
  //    Handlers receive the raw text inside parentheses (not uppercased further here, it's already uppercased).
  formula = formula.replace(
    /(SUM|AVERAGE|MIN|MAX|COUNT|PRODUCT|IF)\(([^)]*)\)/gi,
    (match, fn, inside) => {
      fn = fn.toUpperCase();
      // Debug log for visibility
      console.log(`🧩 Function dispatch: ${fn} with args: ${inside}`);
      if (functionHandlers[fn]) {
        try {
          // Handler should return a number (or a string that can be used in the formula)
          const value = functionHandlers[fn](
            inside,
            allCells,
            cache,
            resolveCellValue,
            expandRange
          );
          // Ensure we inject text that expr-eval can parse — numbers as strings
          return String(value === undefined || value === null ? 0 : value);
        } catch (err) {
          console.error(`Error in handler ${fn}:`, err);
          return "0";
        }
      }
      return "0";
    }
  );

  // 2) Replace top-level cell references (not inside function arguments)
  //    We only replace occurrences that are not inside function parentheses.
  //    Approach: when we find A1, check whether that position is inside an open "(" without a close ")" before it.
  //    If so, skip replacement (function handlers already handled that region).
  formula = formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, col, row, offset) => {
    // Determine if this match lies inside a parentheses that hasn't been closed yet
    // by checking substring before `offset` for unbalanced '('.
    const before = formula.slice(0, offset);
    const open = (before.match(/\(/g) || []).length;
    const close = (before.match(/\)/g) || []).length;
    const inParens = open > close;

    if (inParens) {
      // If inside parentheses, leave it to function handlers (skip replacement)
      return match;
    }

    // Safe to resolve top-level cell
    const id = col + row;
    const v = resolveCellValue(id, allCells, cache);
    return String(Number(v) || 0);
  });

  // 3) Evaluate the final expression with expr-eval
  const parser = new Parser();
  try {
    // parser.evaluate expects a JS-like math expression string
    // After replacements, formula should be a purely numeric math expression.
    return parser.evaluate(formula);
  } catch (err) {
    // On any parse/eval errors, fail gracefully to 0
    console.error("Formula parse/eval error for:", formula, err);
    return 0;
  }
}

module.exports = evaluateFormula;
