"use client";

import axios from "axios";
import { createContext, useState, useEffect, useRef, useCallback } from "react";

export const GridContext = createContext();

export function GridProvider({ children }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [workbookId, setWorkbookId] = useState(null);
  const [cellValues, setCellValues] = useState({});

  const isInitializing = useRef(false);
  const isReinitializingRef = useRef(false);
  const sheetsLoaded = useRef(false);

  // Helper: update workbookId in state + localStorage
  const updateWorkbookId = (id) => {
    if (id) {
      try {
        localStorage.setItem("workbookId", id);
      } catch {
        /* ignore localStorage errors */
      }
    } else {
      try {
        localStorage.removeItem("workbookId");
      } catch {
        /* ignore */
      }
    }

    sheetsLoaded.current = false;
    setWorkbookId(id);
  };

  const hardResetWorkbookState = () => {
    try {
      localStorage.removeItem("workbookId");
    } catch {}
    setWorkbookId(null);
    setActiveSheet(null);
    setCellValues({});
    sheetsLoaded.current = false;
  };

  useEffect(() => {
    console.log("📌 WORKBOOK ID CHANGED:", workbookId);
  }, [workbookId]);

  // -----------------------------------------------------
  // 1️⃣ INITIALIZE WORKBOOK ON FIRST LOAD
  // -----------------------------------------------------
  useEffect(() => {
    if (workbookId || isInitializing.current) return;

    async function initializeWorkbook() {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        const storedWorkbookId =
          typeof window !== "undefined"
            ? localStorage.getItem("workbookId")
            : null;

        if (storedWorkbookId) {
          try {
            // Validate stored ID
            await axios.get(
              `http://localhost:5001/workbook/${storedWorkbookId}/sheets`
            );

            setWorkbookId(storedWorkbookId);
            isInitializing.current = false;
            return;
          } catch (err) {
            console.warn(
              "❌ Invalid or dead workbookId detected:",
              storedWorkbookId
            );

            try {
              localStorage.removeItem("workbookId");
            } catch {}

            setWorkbookId(null);
            setActiveSheet(null);
            sheetsLoaded.current = false;

            // fetch a fresh workbook
            const res = await axios.get("http://localhost:5001/workbook/init");
            const newId = res.data.workbookId;
            console.log("✅ New workbookId from backend:", newId);
            try {
              localStorage.setItem("workbookId", newId);
            } catch {}
            setWorkbookId(newId);
            isInitializing.current = false;
            return;
          }
        }

        // No stored id: create/init
        const res = await axios.get("http://localhost:5001/workbook/init");
        const newWorkbookId = res.data.workbookId;

        if (newWorkbookId) {
          try {
            localStorage.setItem("workbookId", newWorkbookId);
          } catch {}
          setWorkbookId(newWorkbookId);
        } else {
          setWorkbookId(null);
        }
      } catch (err) {
        console.error("Error initializing workbook:", err);
      } finally {
        isInitializing.current = false;
      }
    }

    initializeWorkbook();
  }, []);

  // -----------------------------------------------------
  // 2️⃣ LOAD SHEETS WHEN workbookId CHANGES
  // -----------------------------------------------------
  useEffect(() => {
    sheetsLoaded.current = false;
  }, [workbookId]);

  useEffect(() => {
    if (!workbookId || sheetsLoaded.current) return;

    async function loadSheets() {
      console.log("loadSheets", workbookId);
      try {
        const res = await axios.get(
          `http://localhost:5001/workbook/${workbookId}/sheets`
        );

        const sheetNames = Array.isArray(res.data) ? res.data : [];

        if (sheetNames.length > 0 && !activeSheet) {
          const first = sheetNames[0];
          setActiveSheet(typeof first === "string" ? first : first.name);
        }

        sheetsLoaded.current = true;
      } catch (err) {
        if (err.response?.status === 404) {
          if (isReinitializingRef.current) return;

          isReinitializingRef.current = true;

          hardResetWorkbookState();

          try {
            const res = await axios.get("http://localhost:5001/workbook/init");
            const newWorkbookId = res.data.workbookId;

            if (newWorkbookId) {
              try {
                localStorage.setItem("workbookId", newWorkbookId);
              } catch {}
              setWorkbookId(newWorkbookId);
            } else {
              setWorkbookId(null);
            }
          } catch (initErr) {
            console.error("Error reinitializing workbook:", initErr);
          } finally {
            isReinitializingRef.current = false;
          }
        } else {
          console.error("Error loading sheets:", err);
        }
      }
    }

    loadSheets();
  }, [workbookId]);

  // -----------------------------------------------------
  // 3️⃣ LOAD CELL DATA (and evaluate formulas)
  // make loadData a stable callback so we can call it from listeners
  // -----------------------------------------------------
  const loadData = useCallback(async () => {
    if (!workbookId || !activeSheet) return;

    console.log("loadData", workbookId, activeSheet);
    try {
      const res = await axios.get(
        `http://localhost:5001/cells/${workbookId}?sheet=${encodeURIComponent(
          activeSheet
        )}`
      );
      const raw = res.data || {};

      let newState = { ...raw };

      // Recompute formulas by calling formula service
      for (let cellId in raw) {
        if (raw[cellId]?.startsWith("=")) {
          try {
            const formulaRes = await axios.post("http://localhost:5002/evaluate", {
              cellId,
              rawValue: raw[cellId],
              allCells: raw,
            });
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
  }, [workbookId, activeSheet]);

  // invoke loadData whenever workbookId or activeSheet changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // -----------------------------------------------------
  // 4️⃣ allow external triggers (cells) to request reload
  // by listening to a custom window event "cell-updated"
  // (Cells should dispatch window.dispatchEvent(new Event("cell-updated")))
  // -----------------------------------------------------
  useEffect(() => {
    function refreshAllCells() {
      // call latest loadData
      loadData();
    }

    window.addEventListener("cell-updated", refreshAllCells);
    return () => window.removeEventListener("cell-updated", refreshAllCells);
  }, [loadData]);

  // -----------------------------------------------------
  // 5️⃣ Helpers exposed to components
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
  // 6️⃣ PROVIDER VALUES
  // expose both the raw setter and the wrapper to keep existing callers working
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

        // expose both:
        setWorkbookId,   // the real React setter (keeps backward compatibility)
        updateWorkbookId, // the wrapper that also syncs localStorage

        activeSheet,
        setActiveSheet,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}
