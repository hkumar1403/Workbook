"use client";

import { useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import { useContext } from "react";
import { GridContext } from "@/app/context/GridContext";
export default function UploadCSV() {
  const fileInputRef = useRef(null);

  const { workbookId, activeSheet, setCellValues } = useContext(GridContext);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data; // Array of arrays

        // Convert CSV to { A1: "value", B1: "value", ... }
        const parsedCells = convertCSVToCells(rows);

        try {
          // Save to backend
          await axios.post(
            `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets/${activeSheet}/import`,
            { cells: parsedCells }
          );

          // Update UI instantly
          setCellValues(parsedCells);
        } catch (err) {
          console.error("Error uploading CSV:", err);
        }
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
      >
        Upload CSV
      </button>
    </div>
  );
}

// Convert CSV rows/columns → spreadsheet cell IDs
function convertCSVToCells(rows) {
  const cells = {};

  const colToLetter = (n) => {
    let s = "";
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  };

  rows.forEach((row, r) => {
    row.forEach((value, c) => {
      const cellId = `${colToLetter(c)}${r + 1}`;
      cells[cellId] = value;
    });
  });

  return cells;
}
