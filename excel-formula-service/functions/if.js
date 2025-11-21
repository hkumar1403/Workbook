module.exports = function IF(
  inside,
  allCells,
  cache,
  resolveCellValue,
  expandRange
) {
  function splitArgs(str) {
    let args = [];
    let depth = 0;
    let current = "";

    for (let char of str) {
      if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
      } else {
        current += char;
        if (char === "(") depth++;
        if (char === ")") depth--;
      }
    }

    if (current.trim() !== "") args.push(current.trim());
    return args;
  }

  const parts = splitArgs(inside);

  if (parts.length < 3) {
    console.error("❌ IF() requires 3 parameters");
    return 0;
  }

  let [condition, trueExpr, falseExpr] = parts;

  // ============================================================
  // STEP 1 — Replace cell references in CONDITION with RAW values
  // ============================================================
  condition = condition.replace(/\b([A-Z]+)(\d+)\b/gi, (match, col, row) => {
    const id = col.toUpperCase() + row;
    const raw = allCells[id];

    if (raw === undefined || raw === null || raw === "") return '""';

    // numeric?
    if (!isNaN(Number(raw))) return Number(raw);

    // string?
    return `"${String(raw).toUpperCase()}"`;
  });

  // ============================================================
  // STEP 2 — Detect comparison operators (all Excel operators)
  // ============================================================
  const comparePattern = /(.*?)(=|<>|>=|<=|>|<)(.*)/; // captures left, operator, right

  const match = condition.match(comparePattern);

  if (!match) {
    // No comparison operator → treat as numeric condition
    return evaluateNumericCondition(condition, trueExpr, falseExpr);
  }

  let [, left, operator, right] = match;

  left = left.trim();
  right = right.trim();

  // ============================================================
  // STEP 3 — Evaluate both sides (string OR number)
  // ============================================================
  const leftVal = parseValue(left);
  const rightVal = parseValue(right);

  let result = false;

  // ============================================================
  // STEP 4 — Manual comparison (Excel-style)
  // ============================================================
  switch (operator) {
    case "=":
      result = leftVal == rightVal;
      break;

    case "<>":
      result = leftVal != rightVal;
      break;

    case ">":
      result = Number(leftVal) > Number(rightVal);
      break;

    case "<":
      result = Number(leftVal) < Number(rightVal);
      break;

    case ">=":
      result = Number(leftVal) >= Number(rightVal);
      break;

    case "<=":
      result = Number(leftVal) <= Number(rightVal);
      break;
  }

  return result ? evalExpr(trueExpr) : evalExpr(falseExpr);

  // ============================================================
  // UTIL FUNCTIONS
  // ============================================================

  // Convert raw tokens into numeric or string values
  function parseValue(v) {
    // quoted → string
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      return v.slice(1, -1).toUpperCase();
    }

    // number?
    if (!isNaN(Number(v))) return Number(v);

    return v.toUpperCase();
  }

  // Evaluate the true/false expressions
  function evalExpr(expr) {
    expr = expr.trim();

    // cell reference
    if (/^[A-Z]+\d+$/i.test(expr)) {
      return resolveCellValue(expr.toUpperCase(), allCells, cache);
    }

    // quoted string
    if (
      (expr.startsWith('"') && expr.endsWith('"')) ||
      (expr.startsWith("'") && expr.endsWith("'"))
    ) {
      return expr.slice(1, -1);
    }

    // numeric math expression
    try {
      const { Parser } = require("expr-eval");
      const parser = new Parser();
      return parser.evaluate(expr);
    } catch {
      return expr;
    }
  }

  // Only numeric conditions go here
  function evaluateNumericCondition(condition, trueExpr, falseExpr) {
    try {
      console.log(condition);
      const { Parser } = require("expr-eval");
      const parser = new Parser();
      const numericResult = parser.evaluate(condition);
      return numericResult ? evalExpr(trueExpr) : evalExpr(falseExpr);
    } catch (err) {
      console.log(condition);
      console.error("❌ IF(): Numeric condition error:", err, "in:", condition);
      return evalExpr(falseExpr);
    }
  }
};
