module.exports = function TOPERCENT(inside, allCells, cache, resolveCellValue) {
  // Trim and clean argument
  inside = inside.trim();

  let value;

  // If inside is numeric (like "0.5")
  if (!isNaN(Number(inside))) {
    value = Number(inside);
  } else {
    // It's a cell reference like A1
    value = Number(resolveCellValue(inside.toUpperCase(), allCells, cache)) || 0;
  }

  // Convert to percent
  const percent = (value * 100).toFixed(2);

  // Format as a string with %
  return percent + "%";
};
