// Convert column letters → number index (A=1, B=2, Z=26, AA=27, etc.)
function colToIndex(col) {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result;
}

// Convert number index → column letters (1=A, 2=B, 27=AA, etc.)
function indexToCol(num) {
  let col = "";
  while (num > 0) {
    let mod = (num - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

// Expand "A1:A3" or "A1:C2" ranges into ["A1","A2","A3"] or bigger list
function expandRange(range) {
  if (!range || typeof range !== "string" || !range.includes(":")) {
    console.error("Invalid range passed to expandRange:", range);
    return [];
  }

  const [start, end] = range.split(":");

  if (!start || !end) {
    console.error("Invalid range boundaries:", range);
    return [];
  }

  const colMatch1 = start.match(/[A-Z]+/i);
  const rowMatch1 = start.match(/\d+/);

  const colMatch2 = end.match(/[A-Z]+/i);
  const rowMatch2 = end.match(/\d+/);

  if (!colMatch1 || !rowMatch1 || !colMatch2 || !rowMatch2) {
    console.error("Malformed range for expandRange:", range);
    return [];
  }

  const col1 = colMatch1[0].toUpperCase();
  const row1 = parseInt(rowMatch1[0]);

  const col2 = colMatch2[0].toUpperCase();
  const row2 = parseInt(rowMatch2[0]);

  const startColIndex = colToIndex(col1);
  const endColIndex = colToIndex(col2);

  const cells = [];

  for (let c = startColIndex; c <= endColIndex; c++) {
    for (let r = row1; r <= row2; r++) {
      cells.push(indexToCol(c) + r);
    }
  }

  return cells;
}

module.exports = {
  colToIndex,
  indexToCol,
  expandRange,
};
