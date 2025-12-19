"use client";

import axios from "axios";
import {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { HyperFormula } from "hyperformula";
import { useCellStore } from "../store/cellStore";

export const GridContext = createContext();

export function GridProvider({ children }) {
  // ---------------------------------------------
  // BASIC STATE - Only lightweight state in context
  // ---------------------------------------------
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [workbookId, setWorkbookId] = useState(null);
  const [workbookName, setWorkbookName] = useState("Workbook");
  const [sheets, setSheets] = useState([]);
  
  // Get Zustand store methods (non-reactive, used in callbacks)
  const setCellValues = useCellStore((state) => state.setCellValues);
  const clearCells = useCellStore((state) => state.clearCells);

  // Formula-selection features
  const [formulaModeCell, setFormulaModeCell] = useState(null);
  const [formulaCursor, setFormulaCursor] = useState(null);

  const isInitializing = useRef(false);
  const isReinitializingRef = useRef(false);
  const sheetsLoaded = useRef(false);

  // ---------------------------------------------
  // 🧠 HYPERFORMULA ENGINE
  // ---------------------------------------------
  const hfRef = useRef(null);
  const sheetIdMap = useRef({}); // map sheetName → HF sheetId

  if (!hfRef.current) {
    hfRef.current = HyperFormula.buildEmpty({
      licenseKey: "gpl-v3",
    });
  }

  const hf = hfRef.current;

  // ---------------------------------------------
  // Add Formula Reference During Editing
  // ---------------------------------------------
  const insertCellReferenceIntoFormula = useCallback((refCellId) => {
    if (!formulaModeCell) return;

    // Get current raw value from Zustand store
    const currentRaw = useCellStore.getState().cellValues[formulaModeCell] ?? "";
    const cursor = formulaCursor;

    let newRaw =
      cursor && typeof cursor.start === "number"
        ? currentRaw.slice(0, cursor.start) +
          refCellId +
          currentRaw.slice(cursor.end)
        : currentRaw + refCellId;

    const updateCell = useCellStore.getState().updateCell;
    updateCell(formulaModeCell, newRaw);

    const pos = (cursor?.start ?? currentRaw.length) + refCellId.length;
    setFormulaCursor({ start: pos, end: pos });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("formula-inserted", {
          detail: { cellId: formulaModeCell, cursor: { start: pos, end: pos } },
        })
      );
    }
  }, [formulaModeCell, formulaCursor]);

  // ---------------------------------------------
  // Workbook ID setter
  // ---------------------------------------------
  const updateWorkbookId = useCallback((id) => {
    setWorkbookName("");
    setActiveSheet(null);
    clearCells();
    sheetsLoaded.current = false;
    setSheets([]);

    if (id) {
      localStorage.setItem("workbookId", id);
    } else {
      localStorage.removeItem("workbookId");
    }

    setWorkbookId(id);
  }, [clearCells]);

  const hardResetWorkbookState = useCallback(() => {
    localStorage.removeItem("workbookId");
    setWorkbookId(null);
    setActiveSheet(null);
    clearCells();
    setSheets([]);
    sheetsLoaded.current = false;
  }, [clearCells]);

  // ---------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------
  useEffect(() => {
    if (workbookId || isInitializing.current) return;

    async function initializeWorkbook() {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        const stored = localStorage.getItem("workbookId");

        if (stored) {
          try {
            await axios.get(
              `https://workbook-gc93.onrender.com/workbook/${stored}/sheets`
            );
            const wbRes = await axios.get(
              `https://workbook-gc93.onrender.com/workbook/${stored}`
            );

            setWorkbookName(wbRes.data.name);
            setWorkbookId(stored);
            isInitializing.current = false;
            return;
          } catch {
            localStorage.removeItem("workbookId");

            const res = await axios.get("https://workbook-gc93.onrender.com/workbook/init");
            const newId = res.data.workbookId;

            localStorage.setItem("workbookId", newId);
            setWorkbookId(newId);

            isInitializing.current = false;
            return;
          }
        }

        const res = await axios.get("https://workbook-gc93.onrender.com/workbook/init");
        const newId = res.data.workbookId;

        if (newId) {
          localStorage.setItem("workbookId", newId);
          setWorkbookId(newId);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        isInitializing.current = false;
      }
    }

    initializeWorkbook();
  }, []);

  // ---------------------------------------------
  // LOAD WORKBOOK NAME
  // ---------------------------------------------
  useEffect(() => {
    if (!workbookId) return;

    async function loadName() {
      try {
        const res = await axios.get(
          `https://workbook-gc93.onrender.com/workbook/${workbookId}`
        );
        setWorkbookName(res.data.name);
      } catch (err) {
        console.error("Failed to load workbook name:", err);
      }
    }

    loadName();
  }, [workbookId]);

  // ---------------------------------------------
  // LOAD SHEETS LIST
  // ---------------------------------------------
  useEffect(() => {
    if (!workbookId) return;

    sheetsLoaded.current = false;

    async function loadSheets() {
      try {
        const res = await axios.get(
          `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets`
        );

        const names = Array.isArray(res.data)
          ? res.data.map((s) => (typeof s === "string" ? s : s.name))
          : [];

        setSheets(names);

        if (names.length > 0) {
          setActiveSheet(names[0]);
        }

        sheetsLoaded.current = true;
      } catch (err) {
        console.error("Sheet load error:", err);
      }
    }

    loadSheets();
  }, [workbookId]);

  // ---------------------------------------------
  // HYPERFORMULA HELPERS
  // ---------------------------------------------
  function parseCellId(cellId) {
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const letters = match[1];
    const row = parseInt(match[2], 10) - 1;

    const col =
      letters.split("").reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) -
      1;

    return { row, col };
  }

  function buildCellId(col, row) {
    function colToLetter(n) {
      let s = "";
      while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    }

    return `${colToLetter(col)}${row}`;
  }

  // ---------------------------------------------
  // LOAD DATA + APPLY HYPERFORMULA
  // ---------------------------------------------
  const loadData = useCallback(async () => {
    if (!workbookId || !activeSheet) return;

    try {
      const res = await axios.get(
        `https://workbook-gc93.onrender.com/cells/${workbookId}?sheet=${encodeURIComponent(
          activeSheet
        )}`
      );

      const raw = res.data || {};

      // --------------------------------------------------
      // ENSURE THE ACTIVE SHEET EXISTS IN HYPERFORMULA
      // --------------------------------------------------
      let sheetId;

      // Try to get existing sheet ID
      try {
        const existingId = hf.getSheetId(activeSheet);
        // Verify it's actually a number
        if (typeof existingId === "number") {
          sheetId = existingId;
        } else {
          sheetId = null; // Invalid ID, need to create/recreate
        }
      } catch (e) {
        sheetId = null;
      }

      // If sheet does not exist, create it
      if (sheetId === null || sheetId === undefined) {
        try {
          // Add the sheet (may throw if sheet already exists, which is fine)
          hf.addSheet(activeSheet);
        } catch (addError) {
          // Sheet might already exist, that's okay - we'll get the ID below
        }
        
        // Always get the sheet ID after attempting to add (most reliable method)
        try {
          sheetId = hf.getSheetId(activeSheet);
          // Verify it's actually a number
          if (typeof sheetId !== "number") {
            throw new Error(`getSheetId returned non-number: ${typeof sheetId} (${sheetId})`);
          }
        } catch (getError) {
          console.error("Failed to get sheet ID after creation:", activeSheet, getError);
          return; // Cannot proceed without valid sheet
        }
      }
      
      // Final verification that sheetId is valid
      if (typeof sheetId !== "number") {
        // Last attempt: try to get it from HyperFormula
        try {
          const finalSheetId = hf.getSheetId(activeSheet);
          if (typeof finalSheetId === "number") {
            sheetId = finalSheetId;
          } else {
            console.error("Final sheetId validation failed: getSheetId returned non-number:", finalSheetId, "sheet:", activeSheet);
            return;
          }
        } catch (finalError) {
          console.error("Final sheetId validation failed: cannot get sheet:", activeSheet, finalError);
          return;
        }
      }

      // Store valid numeric ID
      sheetIdMap.current[activeSheet] = sheetId;

      // Final safety check before using sheetId
      if (typeof sheetId !== "number") {
        console.error("Invalid sheetId:", sheetId, "sheet:", activeSheet);
        return; // prevent HF calls from crashing
      }

      // 2️⃣ Clear sheet before loading new values
      hf.clearSheet(sheetId);

      // 3️⃣ Load raw cell values into HyperFormula
      for (let cellId in raw) {
        const pos = parseCellId(cellId);
        if (!pos) continue;

        hf.setCellContents(
          {
            sheet: sheetId,
            row: pos.row,
            col: pos.col,
          },
          raw[cellId]
        );
      }

      // 4️⃣ Get computed matrix
      const matrix = hf.getSheetValues(sheetId);

      // 5️⃣ Convert matrix back into flat state
      const newState = {};

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          const cellId = buildCellId(c + 1, r + 1);
          let computedValue = matrix[r][c];

          // Handle HyperFormula error objects
          if (computedValue && typeof computedValue === "object" && !Array.isArray(computedValue)) {
            // Extract error message or value from error object
            if (computedValue.value !== undefined) {
              computedValue = computedValue.value;
            } else if (computedValue.message !== undefined) {
              computedValue = computedValue.message;
            } else if (computedValue.type !== undefined) {
              computedValue = `#${computedValue.type}`;
            } else {
              // Fallback: convert to string representation
              computedValue = String(computedValue);
            }
          }

          newState[cellId] = raw[cellId] ?? "";
          newState[cellId + "_value"] = computedValue ?? "";
        }
      }

      setCellValues(newState);
    } catch (err) {
      console.error("Error loading cell data:", err);
    }
  }, [workbookId, activeSheet, setCellValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------
  // RELOAD AFTER ANY CELL SAVES
  // ---------------------------------------------
  useEffect(() => {
    function refreshAllCells() {
      loadData();
    }

    window.addEventListener("cell-updated", refreshAllCells);
    return () => window.removeEventListener("cell-updated", refreshAllCells);
  }, [loadData]);

  // Note: getCellDisplayValue is now in Zustand store (cellStore.js)
  // Components should use useCellStore((state) => state.getCellDisplayValue) instead

  // ---------------------------------------------
  // SHEET MANAGEMENT HELPERS
  // ---------------------------------------------
  const renameSheet = useCallback(async (oldName, newName) => {
    if (!workbookId) return;

    try {
      await axios.put(
        `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets/rename`,
        { oldName, newName }
      );
    } catch (err) {
      console.error("Rename error:", err);
    }
  }, [workbookId]);

  const deleteSheet = useCallback(async (sheetName) => {
    if (!workbookId) return;

    try {
      await axios.delete(
        `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets/${sheetName}`
      );
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [workbookId]);

  const renameWorkbook = useCallback(async (newName) => {
    if (!workbookId) return;

    const safeName = newName.slice(0, 300);

    try {
      await axios.put(
        `https://workbook-gc93.onrender.com/workbook/${workbookId}/rename`,
        { name: safeName }
      );
      setWorkbookName(safeName);
    } catch (err) {
      console.error("Workbook rename error:", err);
    }
  }, [workbookId]);

  // ---------------------------------------------
  // PROVIDER VALUE - Only lightweight state
  // ---------------------------------------------
  const contextValue = useMemo(() => ({
    selectedCell,
    setSelectedCell,

    isSidebarOpen,
    setIsSidebarOpen,

    workbookId,
    setWorkbookId,
    updateWorkbookId,

    activeSheet,
    setActiveSheet,

    workbookName,
    setWorkbookName,
    renameWorkbook,

    sheets,
    setSheets,

    renameSheet,
    deleteSheet,

    formulaModeCell,
    setFormulaModeCell,
    formulaCursor,
    setFormulaCursor,
    insertCellReferenceIntoFormula,
  }), [
    selectedCell,
    isSidebarOpen,
    workbookId,
    activeSheet,
    workbookName,
    sheets,
    formulaModeCell,
    formulaCursor,
    updateWorkbookId,
    renameWorkbook,
    renameSheet,
    deleteSheet,
    insertCellReferenceIntoFormula,
  ]);

  return (
    <GridContext.Provider value={contextValue}>
      {children}
    </GridContext.Provider>
  );
}
