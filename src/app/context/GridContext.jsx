"use client";

import axios from "axios";
import { createContext, useState, useEffect } from "react";

export const GridContext = createContext();

export function GridProvider({ children }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  // Stores the current workbook ID (comes from DB)
  const [workbookId, setWorkbookId] = useState(null);

  // Stores cell values for the active sheet
  const [cellValues, setCellValues] = useState({});

  // -----------------------------------------------------
  // 1️⃣ INIT WORKBOOK (Load existing workbook OR create new)
  // -----------------------------------------------------
  useEffect(() => {
    async function initWorkbook() {
      try {
        const res = await axios.get("http://localhost:5001/workbook/init");

        // backend returns: { workbookId: "abc123..." }
        setWorkbookId(res.data.workbookId);
      } catch (err) {
        console.error("Error initializing workbook:", err);
      }
    }

    initWorkbook();
  }, []);

  // -----------------------------------------------------
  // 2️⃣ LOAD SHEETS AND SET ACTIVE SHEET WHEN workbookId IS READY
  // -----------------------------------------------------
  useEffect(() => {
    // wait until workbookId is loaded
    if (!workbookId) return;

    async function loadSheets() {
      try {
        const res = await axios.get(
          `http://localhost:5001/workbook/${workbookId}/sheets`
        );

        // Backend returns an array of sheet names: ["Sheet1", "Sheet2", ...]
        const sheetNames = Array.isArray(res.data) ? res.data : [];
        
        // Set first sheet as active if available and not already set
        if (sheetNames.length > 0 && !activeSheet) {
          setActiveSheet(sheetNames[0]);
        }
      } catch (err) {
        console.error("Error loading sheets:", err);
      }
    }

    loadSheets();
  }, [workbookId, activeSheet]);

  // -----------------------------------------------------
  // 3️⃣ LOAD CELL DATA WHEN workbookId AND activeSheet ARE READY
  // -----------------------------------------------------
  useEffect(() => {
    // wait until workbookId and activeSheet are loaded
    if (!workbookId || !activeSheet) return;

    async function loadData() {
      try {
        const res = await axios.get(
          `http://localhost:5001/cells/${workbookId}`
        );
        const raw = res.data || {};

        let newState = { ...raw };

        // Recompute formulas
        for (let cellId in raw) {
          if (raw[cellId]?.startsWith("=")) {
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

        setCellValues(newState);
      } catch (err) {
        console.error("Error loading cell data:", err);
      }
    }

    loadData();
  }, [workbookId, activeSheet]);

  // -----------------------------------------------------
  // 4️⃣ GET DISPLAY VALUE FOR ANY CELL
  // -----------------------------------------------------
  function getCellDisplayValue(cellId) {
    const raw = cellValues[cellId];
    const computed = cellValues[cellId + "_value"];

    if (computed !== undefined) return computed; // formula result
    if (!raw) return ""; // empty cell
    if (!raw.startsWith("=")) return raw; // raw text/number
    return ""; // formula still computing
  }

  // -----------------------------------------------------
  // 5️⃣ PROVIDE VALUES TO THE APP
  // -----------------------------------------------------
  return (
    <GridContext.Provider
      value={{
        selectedCell,
        setSelectedCell,

        cellValues,
        setCellValues,
        getCellDisplayValue,

        isSidebarOpen,
        setIsSidebarOpen,

        workbookId,
        setWorkbookId,
        activeSheet,
        setActiveSheet,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}
