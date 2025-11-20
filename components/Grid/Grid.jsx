"use client";

import Cell from "./Cell";

export default function Grid() {
  const rows =250;
  const columns = 25;

  // Convert number → Excel letter (1 → A, 27 → AA)
  function colToLetter(col) {
    let result = "";
    while (col > 0) {
      const remainder = (col - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      col = Math.floor((col - 1) / 26);
    }
    return result;
  }

  // Build column headers
  const columnHeaders = [];
  for (let c = 1; c <= columns; c++) {
    columnHeaders.push(
      <div
        key={`col-${c}`}
        className="w-20 h-10 flex items-center justify-center border font-bold bg-gray-100 text-black"
      >
        {colToLetter(c)}
      </div>
    );
  }

  const headerRow = (
    <div className="flex">
      {/* Empty corner */}
      <div className="w-10 h-10 border bg-gray-200 text-black"></div>
      {columnHeaders}
    </div>
  );

  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const cells = [];

    // Row number label
    cells.push(
      <div
        key={`row-label-${r}`}
        className="w-10 h-10 flex items-center justify-center border font-bold bg-gray-100 text-black"
      >
        {r}
      </div>
    );

    // Cells
    for (let c = 1; c <= columns; c++) {
      cells.push(<Cell row={r} col={c} key={`r${r}c${c}`} />);
    }

    grid.push(
      <div key={`row-${r}`} className="flex">
        {cells}
      </div>
    );
  }

  return (
    <div>
      {headerRow}
      {grid}
    </div>
  );
}
