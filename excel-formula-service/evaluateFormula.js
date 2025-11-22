// excel-formula-service/evaluateFormula.js
const { Parser } = require("expr-eval");
const { expandRange } = require("./helpers");

// import centralized formula registry (each function is in /functions/*.js)
const fjs = require("formulajs");

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
 * Extract and replace functions safely (supports nested parentheses).
 * Calls `callback(fnName, insideString)` and replaces the full function call
 * (including its parentheses) with the callback's return value.
 */
function extractFunctions(formula, callback) {
  const funcs = Object.keys(fjs).map((fn) => fn.toUpperCase());

  let i = 0;

  while (i < formula.length) {
    let matched = false;

    for (const fn of funcs) {
      // match function name followed by '(' at current position (case-insensitive)
      const slice = formula.slice(i, i + fn.length + 1).toUpperCase();
      if (slice === fn + "(") {
        let start = i + fn.length + 1; // position after '('
        let depth = 1;
        let pos = start;

        // walk forward until the matching ')' is found (depth reaches 0)
        while (pos < formula.length && depth > 0) {
          if (formula[pos] === "(") depth++;
          else if (formula[pos] === ")") depth--;
          pos++;
        }

        // If we didn't find a matching close paren, bail to avoid infinite loop
        if (depth !== 0) {
          // malformed formula — just skip this fn occurrence
          i++;
          matched = true;
          break;
        }

        const inside = formula.slice(start, pos - 1);
        const full = formula.slice(i, pos); // fn(...)

        // call handler and coerce to string for safe insertion
        let replacement;
        try {
          replacement = callback(fn, inside);
        } catch (err) {
          console.error(`Error while handling function ${fn}:`, err);
          replacement = "0";
        }

        // ensure replacement is string (expr-eval expects JS-like tokens)
        // Insert numeric values as raw numbers; strings keep quotes
        // Correct handling: numbers stay numbers, strings get quotes
        if (typeof replacement === "number") {
          replacement = String(replacement);
        } else {
          replacement = `"${String(replacement)}"`;
        }

        // replace the first occurrence of `full` at position i
        formula = formula.slice(0, i) + replacement + formula.slice(pos);

        // restart scanning from beginning (simple approach avoids edge-cases)
        i = 0;
        matched = true;
        break;
      }
    }

    if (!matched) i++;
  }

  return formula;
}

function parseArgsForFormulajs(inside, allCells, cache) {
  // split on commas not inside parentheses
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

  // resolve cell references and ranges
  return args.map(arg => {
    // A1:B3 → array of numbers
    if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(arg)) {
      const ids = expandRange(arg);
      return ids.map(id => resolveCellValue(id, allCells, cache));
    }

    // single cell
    if (/^[A-Z]+\d+$/i.test(arg)) {
      return resolveCellValue(arg.toUpperCase(), allCells, cache);
    }

    // number literal
    if (!isNaN(Number(arg))) return Number(arg);

    // quoted string
    if ((arg.startsWith('"') && arg.endsWith('"')) ||
        (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }

    return arg; // leave unchanged
  });
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

  // 1) Function dispatch: use extractFunctions to handle nested calls safely
  formula = extractFunctions(formula, (fn, inside) => {
    fn = fn.toUpperCase();
    // Debug log for visibility
    console.log(`🧩 Function dispatch: ${fn} with args: ${inside}`);
    if (fjs[fn]) {
      try {
        const args = parseArgsForFormulajs(inside, allCells, cache);
        const value = fjs[fn](...args);
        return value;
      } catch (err) {
        console.error(`Formulajs error for ${fn}:`, err);
        return "0";
      }
    }
    return "0";
  });

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

  // BEFORE evaluating, detect if formula is a pure string
  if (
    (formula.startsWith('"') && formula.endsWith('"')) ||
    (formula.startsWith("'") && formula.endsWith("'"))
  ) {
    return formula.slice(1, -1); // return raw text
  }

  // Detect raw alphabetic strings (like SMALL, HIGH)
  if (/^[A-Z]+$/i.test(formula)) {
    return formula; // return as-is
  }
  // 3) Evaluate the final expression with expr-eval
  const parser = new Parser();
  try {
    return parser.evaluate(formula);
  } catch (err) {
    // If parsing fails, log and return the raw formula (so "HIGH" returns "HIGH")
    console.error("Formula parse/eval error for:", formula, err);
    return formula;
  }
}

module.exports = evaluateFormula;
