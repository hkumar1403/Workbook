// functions/text.js
// TEXT(value, format) -> simple formatter for dates/times and basic numbers
// - Supports date tokens: YYYY, DD, MM (month)
// - Supports time tokens: HH (hours), MIN or mm (minutes), SS or ss (seconds)
// - Accepts value as:
//     • quoted string (e.g. "14-01-2025" or "14-01-2025 12:34:56")
//     • numeric literal
//     • cell reference (resolved via resolveCellValue)
// - Basic number formatting:
//     • "0.00" -> fixed decimals
//     • "0000" -> zero-pad integer
//
// NOTE: This intentionally keeps the implementation small and pragmatic — not
// a full Excel-format engine, but covers the common cases you requested.

module.exports = function TEXT(inside, allCells, cache, resolveCellValue) {
  // split arguments (simple split ok because evaluateFormula will have expanded nested functions)
  const parts = inside.split(",").map((p) => p.trim());

  // Need at least two args: value and format
  if (parts.length < 2) return "";

  let [value, format] = parts;

  // --- RESOLVE the value argument ---

  // If value is quoted string, remove quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else if (!isNaN(Number(value))) {
    // numeric literal
    value = Number(value);
  } else {
    // treat as a cell reference or expression result (resolveCellValue returns number or string)
    value = resolveCellValue(value, allCells, cache);
  }

  // --- RESOLVE the format string (strip quotes if present) ---
  if (
    (format.startsWith('"') && format.endsWith('"')) ||
    (format.startsWith("'") && format.endsWith("'"))
  ) {
    format = format.slice(1, -1);
  }

  // Normalise format to exact casing where needed:
  // We'll support both "MM" (month) and "mm" (minutes) by treating them differently;
  // to avoid accidental overlap we will do replacements in a safe order.

  // --- DATE PARSING: detect if `value` looks like a date produced by TODAY()/NOW()
  // We accept:
  //  - "DD-MM-YYYY"
  //  - "DD-MM-YYYY HH:MM:SS"
  // If so, build a JS Date from it.
  let date = null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const [datePart, timePart] = trimmed.split(" ");
    const dateSegments = datePart && datePart.split("-");
    if (
      Array.isArray(dateSegments) &&
      dateSegments.length === 3 &&
      !isNaN(Number(dateSegments[0])) &&
      !isNaN(Number(dateSegments[1])) &&
      !isNaN(Number(dateSegments[2]))
    ) {
      // dateSegments are [DD, MM, YYYY]
      const d = String(dateSegments[0]).padStart(2, "0");
      const m = String(dateSegments[1]).padStart(2, "0");
      const y = String(dateSegments[2]);
      const timeStr = timePart || "00:00:00";
      // construct ISO-like string for reliable Date parsing
      date = new Date(`${y}-${m}-${d}T${timeStr}`);
      if (isNaN(date)) date = null; // fallback if parsing fails
    }
  }

  // ---------- CASE A: date formatting ----------
  if (date instanceof Date && !isNaN(date)) {
    const DD = String(date.getDate()).padStart(2, "0");
    const MM = String(date.getMonth() + 1).padStart(2, "0"); // month
    const YYYY = String(date.getFullYear());

    const HH = String(date.getHours()).padStart(2, "0");
    const MIN = String(date.getMinutes()).padStart(2, "0"); // minutes
    const SS = String(date.getSeconds()).padStart(2, "0");

    // safe replacement order to avoid token clobbering:
    // 1) YYYY
    // 2) DD
    // 3) HH
    // 4) MIN (or mm)
    // 5) SS
    // 6) MM (month) last (so 'MM' doesn't accidentally change parts of 'MIN')
    let out = format;
    out = out.replace(/YYYY/g, YYYY);
    out = out.replace(/DD/g, DD);
    out = out.replace(/HH/g, HH);

    // support both MIN and mm for minutes
    out = out.replace(/MIN/g, MIN); // user may use uppercase MIN
    out = out.replace(/mm/g, MIN); // user may use lowercase 'mm' for minutes

    out = out.replace(/SS/g, SS);
    // Now replace month token (MM) — do this last
    out = out.replace(/MM/g, MM);

    return out;
  }

  // ---------- CASE B: numeric formatting ----------
  if (typeof value === "number") {
    // 1) Decimal formatting like "0.00" -> produce fixed decimals
    if (format.includes(".")) {
      const decimals = format.split(".")[1].length;
      return Number(value).toFixed(decimals);
    }

    // 2) Zero-padding pattern like "0000"
    if (/^0+$/.test(format)) {
      const digits = format.length;
      const intStr = String(Math.trunc(value));
      return intStr.padStart(digits, "0");
    }

    // default numeric -> string
    return String(value);
  }

  // ---------- CASE C: fallback, return raw string ----------
  return String(value);
};
