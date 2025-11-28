"use client";

import axios from "axios";
import { createContext, useState, useEffect, useRef } from "react";

export const GridContext = createContext();

export function GridProvider({ children }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  // Stores the current workbook ID (comes from DB)
  const [workbookId, setWorkbookId] = useState(null);

  // Stores cell values for the active sheet
  const [cellValues, setCellValues] = useState({});

  // Track if we're currently initializing to prevent infinite loops
  const isInitializing = useRef(false);
  const isReinitializingRef = useRef(false); // Guard for reinitialization
  const sheetsLoaded = useRef(false);

  // -----------------------------------------------------
  // 1️⃣ INITIALIZE WORKBOOK ON FIRST LOAD
  // Check localStorage, or call /workbook/init if needed
  // -----------------------------------------------------
  useEffect(() => {
    // Only run once on mount
    if (workbookId || isInitializing.current) return;

    async function initializeWorkbook() {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        // Check localStorage first
        const storedWorkbookId = localStorage.getItem("workbookId");
        
        if (storedWorkbookId) {
          // Verify the workbook exists by trying to load sheets
          try {
            const res = await axios.get(
              `http://localhost:5001/workbook/${storedWorkbookId}/sheets`
            );
            // Workbook exists, use it
            setWorkbookId(storedWorkbookId);
            isInitializing.current = false;
            return;
          } catch (err) {
            // Workbook doesn't exist (404), clear localStorage and create new one
            if (err.response?.status === 404) {
              localStorage.removeItem("workbookId");
            }
          }
        }

        // No valid workbookId, create a new one
        const res = await axios.get("http://localhost:5001/workbook/init");
        const newWorkbookId = res.data.workbookId;
        
        if (newWorkbookId) {
          localStorage.setItem("workbookId", newWorkbookId);
          setWorkbookId(newWorkbookId);
        }
      } catch (err) {
        console.error("Error initializing workbook:", err);
      } finally {
        isInitializing.current = false;
      }
    }

    initializeWorkbook();
  }, []); // Only run once on mount

  // -----------------------------------------------------
  // 2️⃣ LOAD SHEETS AND SET ACTIVE SHEET WHEN workbookId IS READY
  // -----------------------------------------------------
  useEffect(() => {
    // Reset sheetsLoaded flag when workbookId changes
    sheetsLoaded.current = false;
  }, [workbookId]);

  useEffect(() => {
    // wait until workbookId is loaded
    if (!workbookId || sheetsLoaded.current) return;

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
        
        sheetsLoaded.current = true;
      } catch (err) {
        // If 404, workbook doesn't exist - reinitialize ONCE
        if (err.response?.status === 404) {
          // Guard: prevent multiple simultaneous reinitializations
          if (isReinitializingRef.current) {
            return;
          }
          
          isReinitializingRef.current = true;
          console.log("Workbook not found, reinitializing...");
          
          // Clear invalid workbookId from localStorage and state
          localStorage.removeItem("workbookId");
          setWorkbookId(null);
          sheetsLoaded.current = false;
          
          try {
            const res = await axios.get("http://localhost:5001/workbook/init");
            const newWorkbookId = res.data.workbookId;
            if (newWorkbookId) {
              localStorage.setItem("workbookId", newWorkbookId);
              setWorkbookId(newWorkbookId);
            }
          } catch (initErr) {
            console.error("Error reinitializing workbook:", initErr);
          } finally {
            // Reset flag after reinitialization completes
            isReinitializingRef.current = false;
          }
        } else {
          console.error("Error loading sheets:", err);
        }
      }
    }

    loadSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbookId]); // Only depend on workbookId - activeSheet is set inside, not a dependency

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
        setWorkbookId: (id) => {
          if (id) {
            localStorage.setItem("workbookId", id);
            sheetsLoaded.current = false; // Reset sheets loaded flag when workbookId changes
          }
          setWorkbookId(id);
        },
        activeSheet,
        setActiveSheet,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}
