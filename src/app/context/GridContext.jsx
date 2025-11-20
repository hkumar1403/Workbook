"use client";

import axios from "axios";
import { createContext, useState, useEffect } from "react";

export const GridContext = createContext();

export function GridProvider({ children }) {
  const [selectedCell, setSelectedCell] = useState(null);

  // Stores RAW values (like "10" or "=A1+5")
  const [cellValues, setCellValues] = useState({});

  // Load saved raw values from cell-service
  useEffect(() => {
    async function loadData() {
      try {
        const res = await axios.get("http://localhost:5001/cells/sheet1");
        const raw = res.data || {};

        // STEP 1: Set raw values first
        let newState = { ...raw };

        // STEP 2: Recalculate formulas for all formula cells
        for (let cellId in raw) {
          if (raw[cellId].startsWith("=")) {
            try {
              const formulaRes = await axios.post(
                "http://localhost:5002/evaluate",
                {
                  cellId,
                  rawValue: raw[cellId],
                  allCells: raw,
                }
              );

              newState[cellId + "_value"] = formulaRes.data.result;
            } catch {
              newState[cellId + "_value"] = "ERR";
            }
          }
        }

        // STEP 3: Save raw + computed values to React state
        setCellValues(newState);
      } catch (err) {
        console.error("Error loading cell data:", err);
      }
    }

    loadData();
  }, []);

  // Compute display value for a cell
  function getCellDisplayValue(cellId) {
    const raw = cellValues[cellId];
    const computed = cellValues[cellId + "_value"];

    if (computed !== undefined) return computed; // computed value from formula service
    if (!raw) return ""; // empty cell
    if (!raw.startsWith("=")) return raw; // normal raw number or text
    return ""; // raw formula, will compute after Enter
  }

  return (
    <GridContext.Provider
      value={{
        selectedCell,
        setSelectedCell,
        cellValues,
        setCellValues,
        getCellDisplayValue,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}
