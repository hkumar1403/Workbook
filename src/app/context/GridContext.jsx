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
  // 1️⃣ INIT WORKBOOK - Only called from page.js redirect
  // GridContext no longer initializes workbook automatically
  // workbookId should be set from URL params in workbook/[id]/page.jsx
  // -----------------------------------------------------

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
        // Use correct API: GET /cells/:workbookId?sheet=SheetName
        const res = await axios.get(
          `http://localhost:5001/cells/${workbookId}?sheet=${activeSheet}`
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

  const renameSheet = async (oldName, newName) => {
    if (!workbookId) return;

    try {
      await axios.put(
        `http://localhost:5001/workbook/${workbookId}/sheets/rename`,
        { oldName, newName }
      );
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  const deleteSheet = async (sheetName) => {
    if (!workbookId) return;

    try {
      await axios.delete(
        `http://localhost:5001/workbook/${workbookId}/sheets/${sheetName}`
      );
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

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
        renameSheet,
        deleteSheet,
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
