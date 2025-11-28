"use client";

import { useState, useRef, useCallback } from "react";
import Cell from "./Cell";

/**
 * Convert number -> Excel column letters
 */
function colToLetter(num) {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export default function Grid() {
  const rows = 1000;
  const columns = 26;
  // Default width for all columns
  const [colWidths, setColWidths] = useState(
    Array(columns+1).fill(120) // 120px default width
  );

  // Track resizing
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Mouse down on resizer
  const beginResize = (index, e) => {
    resizingCol.current = index;
    startX.current = e.clientX;
    startWidth.current = colWidths[index];

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  // Mouse move
  const handleResize = useCallback(
    (e) => {
      if (resizingCol.current === null) return;

      const diff = e.clientX - startX.current;
      const newWidth = Math.max(50, startWidth.current + diff); // min width 50px

      setColWidths((prev) => {
        const updated = [...prev];
        updated[resizingCol.current] = newWidth;
        return updated;
      });
    },
    [setColWidths]
  );

  // Mouse up
  const stopResize = () => {
    resizingCol.current = null;

    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  };

  // Build column headers
  const columnHeaders = [];
  for (let c = 1; c <= columns; c++) {
    const idx = c - 1;

    columnHeaders.push(
      <div
        key={`col-${c}`}
        className="table-cell h-10 border bg-gray-100 text-black font-bold text-center align-middle relative select-none"
        style={{ width: colWidths[idx] }}
      >
        {colToLetter(c)}

        {/* Resize handle */}
        <div
          onMouseDown={(e) => beginResize(idx, e)}
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-300"
        ></div>
      </div>
    );
  }

  const headerRow = (
    <div className="table-row">
      <div className="table-cell w-10 h-10 border bg-gray-200"></div>
      {columnHeaders}
    </div>
  );

  // Build grid rows
  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const cells = [];

    // Row label
    cells.push(
      <div
        key={`row-label-${r}`}
        className="table-cell w-10 h-10 border bg-gray-100 text-black font-bold text-center align-middle"
      >
        {r}
      </div>
    );

    // Cells
    for (let c = 1; c <= columns; c++) {
      const idx = c - 1;
      cells.push(
        <Cell key={`r${r}c${c}`} row={r} col={c} width={colWidths[c]} />
      );
    }

    grid.push(
      <div key={`row-${r}`} className="table-row">
        {cells}
      </div>
    );
  }

  return (
    <div className="table border-collapse">
      {headerRow}
      {grid}
    </div>
  );
}

