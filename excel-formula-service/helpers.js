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
  const [start, end] = range.split(":");

  const col1 = start.match(/[A-Z]+/)[0];
  const row1 = parseInt(start.match(/\d+/)[0]);

  const col2 = end.match(/[A-Z]+/)[0];
  const row2 = parseInt(end.match(/\d+/)[0]);

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
