// excel-formula-service/evaluateFormula.js
const { Parser } = require("expr-eval");
const { expandRange } = require("./helpers");
const fjs = require("formulajs");

/**
 * Resolve a cell's numeric value (handles formulas recursively)
 */
function resolveCellValue(cellId, allCells, cache) {
  if (cache[cellId] === Symbol.for("IN_PROGRESS")) {
    console.error(`⛔ Circular reference detected for ${cellId}`);
    return 0;
  }

  if (cache[cellId] !== undefined) return cache[cellId];
  cellId = cellId.toUpperCase();
  const raw = allCells[cellId];

  if (!raw) {
    cache[cellId] = 0;
    return 0;
  }

  // Non-formula value
  if (!String(raw).startsWith("=")) {
    const num = Number(raw);
    cache[cellId] = isNaN(num) ? 0 : num;
    return cache[cellId];
  }

  // Formula
  cache[cellId] = Symbol.for("IN_PROGRESS");
  try {
    const result = evaluateFormula(raw, allCells, cache);
    cache[cellId] = result;
    return result;
  } catch (e) {
    console.error("Formula evaluation error:", e);
    cache[cellId] = 0;
    return 0;
  }
}

/**
 * Extract functions & replace with computed values
 */
function extractFunctions(formula, callback) {
  const funcs = Object.keys(fjs);
  let i = 0;

  while (i < formula.length) {
    let matched = false;

    for (const fn of funcs) {
      const upper = fn.toUpperCase();
      const slice = formula.slice(i, i + upper.length + 1).toUpperCase();

      if (slice === upper + "(") {
        let start = i + upper.length + 1;
        let depth = 1;
        let pos = start;

        while (pos < formula.length && depth > 0) {
          if (formula[pos] === "(") depth++;
          else if (formula[pos] === ")") depth--;
          pos++;
        }

        if (depth !== 0) {
          i++;
          matched = true;
          break;
        }

        const inside = formula.slice(start, pos - 1);

        let replacement;
        try {
          replacement = callback(fn, inside);
        } catch (err) {
          console.error("Function handler error:", fn, err);
          replacement = "0";
        }

        // Normalize return value to JS-safe literal
        if (typeof replacement === "string") {
          if (
            (replacement.startsWith('"') && replacement.endsWith('"')) ||
            (replacement.startsWith("'") && replacement.endsWith("'"))
          ) {
            // already quoted
          } else {
            replacement = `"${replacement}"`;
          }
        } else if (typeof replacement === "boolean") {
          replacement = replacement ? "true" : "false";
        } else if (Array.isArray(replacement)) {
          replacement = `[${replacement
            .map((v) => JSON.stringify(v))
            .join(",")}]`;
        } else {
          replacement = String(replacement);
        }

        // Replace the whole function call
        formula = formula.slice(0, i) + replacement + formula.slice(pos);

        i = 0;
        matched = true;
        break;
      }
    }

    if (!matched) i++;
  }

  return formula;
}

/**
 * Parse arguments for Formulajs
 */

function parseArgsForFormulajs(inside, allCells, cache) {
  let args = [];
  let current = "";
  let depth = 0;

  for (let ch of inside) {
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
      if (ch === "(") depth++;
      if (ch === ")") depth--;
    }
  }
  if (current.trim()) args.push(current.trim());

  return args.map((arg) => {
    // Range A1:B5
    if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(arg)) {
      return expandRange(arg).map((id) =>
        resolveCellValue(id, allCells, cache)
      );
    }

    // Single cell A1
    if (/^[A-Z]+\d+$/i.test(arg)) {
      return resolveCellValue(arg.toUpperCase(), allCells, cache);
    }

    // Number literal
    if (!isNaN(Number(arg))) return Number(arg);

    // Quoted string
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1);
    }

    // Boolean literal TRUE / FALSE
    if (/^(TRUE|FALSE)$/i.test(arg)) {
      return arg.toUpperCase() === "TRUE";
    }

    // Try to evaluate expressions (comparisons, arithmetic, nested expressions)
    try {
      // Evaluate using expr-eval, but we must replace cell refs inside 'arg'
      // e.g. "A1>2" -> replace A1 with its numeric value first
      const replaced = arg.replace(/\b([A-Z]+)(\d+)\b/gi, (m, col, row) => {
        const id = (col + row).toUpperCase();
        // If cell missing, treat as 0
        const val = Number(resolveCellValue(id, allCells, cache));
        // If val is a string that is not a number, wrap in quotes
        if (typeof val === "string") return JSON.stringify(val);
        return String(val);
      });

      // Use Parser to evaluate the replaced expression
      return Parser.evaluate
        ? Parser.evaluate(replaced)
        : new Parser().evaluate(replaced);
    } catch (e) {
      // If parsing fails, return the raw arg (safe fallback)
      return arg;
    }
  });
}

/**
 * Main evaluateFormula
 */
function evaluateFormula(rawValue, allCells, cache = {}) {
  // If not a formula
  if (!rawValue || !rawValue.startsWith("=")) {
    const num = Number(rawValue);
    return isNaN(num) ? 0 : num;
  }

  let formula = rawValue.slice(1);

  // 🔥 Normalize function names only (not arguments)
  formula = formula.replace(
    /\b([a-zA-Z]+)\s*\(/g,
    (m, fn) => fn.toUpperCase() + "("
  );

  // Replace built-in functons
  formula = extractFunctions(formula, (fn, inside) => {
    if (fjs[fn]) {
      try {
        const args = parseArgsForFormulajs(inside, allCells, cache);
        return fjs[fn](...args);
      } catch (err) {
        console.error(`Error in formulajs.${fn}:`, err);
        return "0";
      }
    }
    return "0";
  });

  // Replace top-level cell references
  formula = formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, col, row, offset) => {
    const before = formula.slice(0, offset);
    const open = (before.match(/\(/g) || []).length;
    const close = (before.match(/\)/g) || []).length;

    if (open > close) return match; // skip inside functions

    const id = (col + row).toUpperCase();
    return String(Number(resolveCellValue(id, allCells, cache)) || 0);
  });

  // Pure string literal
  if (
    (formula.startsWith('"') && formula.endsWith('"')) ||
    (formula.startsWith("'") && formula.endsWith("'"))
  ) {
    return formula.slice(1, -1);
  }

  // Pure text (return as-is)
  if (/^[A-Z]+$/i.test(formula)) return formula;

  // Evaluate with expr-eval
  try {
    return new Parser().evaluate(formula);
  } catch (err) {
    console.error("Formula parse error for:", formula, err);
    return formula;
  }
}

module.exports = evaluateFormula;
