"use client";

import { useState, useRef, useCallback, useEffect, useContext } from "react";
import { GridContext } from "@/app/context/GridContext";
import axios from "axios";
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
  const [columnLabels, setColumnLabels] = useState([]);
  const [colMenu, setColMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    colIndex: null,
  });

  const rows = 1000;
  // Default width for all columns
  const [colWidths, setColWidths] = useState([]);
  useEffect(() => {
    if (columnLabels.length > 0) {
      setColWidths((prev) => {
        // if widths already match, do nothing
        if (prev.length === columnLabels.length) return prev;

        // otherwise generate new widths
        const newWidths = [...prev];

        while (newWidths.length < columnLabels.length) {
          newWidths.push(120);
        }

        return newWidths;
      });
    }
  }, [columnLabels]);

  const { workbookId, activeSheet } = useContext(GridContext);

  useEffect(() => {
    if (!workbookId || !activeSheet) return;

    axios
      .get(`http://localhost:5001/workbook/${workbookId}/sheets`)
      .then((res) => {
        const sheet = res.data.find((s) => s.name === activeSheet);
        if (sheet) setColumnLabels(sheet.columnLabels);
      })
      .catch((err) => console.error("Load column labels error:", err));
  }, [workbookId, activeSheet]);

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

  // Create new columns
  async function addColumnLeft(index) {
    const res = await axios.post(
      `http://localhost:5001/workbook/${workbookId}/sheets/${activeSheet}/columns`,
      { index, direction: "left" }
    );

    setColumnLabels(res.data.columns);

    setColWidths((prev) => {
      const updated = [...prev];
      updated.splice(index, 0, 120);
      return updated;
    });
  }

  async function addColumnRight(index) {
    const res = await axios.post(
      `http://localhost:5001/workbook/${workbookId}/sheets/${activeSheet}/columns`,
      { index, direction: "right" }
    );

    setColumnLabels(res.data.columns);

    setColWidths((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, 120);
      return updated;
    });
  }

  function syncColumnWidths(totalColumns) {
    setColWidths((prev) => {
      const newWidths = [...prev];

      while (newWidths.length < totalColumns) {
        newWidths.push(120);
      }

      return newWidths;
    });
  }

  // Build column headers
  const columnHeaders = columnLabels.map((label, idx) => (
    <div
      key={label}
      className="table-cell h-10 border bg-gray-100 text-black font-bold text-center align-middle relative select-none"
      style={{ width: colWidths[idx], minWidth: colWidths[idx] }}
      onContextMenu={(e) => {
        e.preventDefault();
        setColMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          colIndex: idx,
        });
      }}
    >
      {label}

      {/* Resize handle */}
      <div
        onMouseDown={(e) => beginResize(idx, e)}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-300"
      ></div>
    </div>
  ));

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
    for (let c = 1; c <= columnLabels.length; c++) {
      const idx = c - 1;
      cells.push(
        <Cell key={`r${r}c${c}`} row={r} col={c} width={colWidths[c - 1]} />
      );
    }

    grid.push(
      <div key={`row-${r}`} className="table-row">
        {cells}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto w-full">
        <div className="table border-collapse table-fixed">
          {headerRow}
          {grid}
        </div>
      </div>

      {/* Right-click menu */}
      {colMenu.visible && (
        <div
          className="fixed bg-white shadow-lg border rounded text-sm z-50"
          style={{ top: colMenu.y, left: colMenu.x }}
        >
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700"
            onClick={() => {
              addColumnLeft(colMenu.colIndex);
              setColMenu({ ...colMenu, visible: false });
            }}
          >
            Insert column left
          </button>

          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700"
            onClick={() => {
              addColumnRight(colMenu.colIndex);
              setColMenu({ ...colMenu, visible: false });
            }}
          >
            Insert column right
          </button>
        </div>
      )}
    </>
  );
}
