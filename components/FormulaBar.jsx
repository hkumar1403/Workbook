"use client";

import axios from "axios";
import { useContext, useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { GridContext } from "@/app/context/GridContext";
import { useCellStore, useCellRawValue } from "@/app/store/cellStore";
import * as fjs from "formulajs";

function FormulaBar() {
  const { selectedCell, activeSheet, workbookId, setFormulaModeCell } = useContext(GridContext);
  
  // Use Zustand store instead of context for cell values
  const updateCell = useCellStore((state) => state.updateCell);
  const setCellValues = useCellStore((state) => state.setCellValues);

  const [localInput, setLocalInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Memoize FUNCTION_NAMES to prevent recreation on every render
  const FUNCTION_NAMES = useMemo(() => 
    Object.keys(fjs).map(fn => fn.toUpperCase()).sort(),
    []
  );
  
  // Get cell raw value using optimized selector (only rerenders when selectedCell changes)
  const selectedCellRawValue = useCellRawValue(selectedCell || '');

  // Load selected cell raw value - only when selectedCell changes
  useEffect(() => {
    if (selectedCell) {
      setLocalInput(selectedCellRawValue || "");
      setSuggestions([]);
    }
  }, [selectedCell, selectedCellRawValue]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalInput(value);

    if (value.startsWith("=")) {
      const typed = value.slice(1).toUpperCase();

      if (/^[A-Z]+$/.test(typed)) {
        const matches = FUNCTION_NAMES.filter(fn =>
          fn.startsWith(typed)
        );
        setSuggestions(matches);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [FUNCTION_NAMES]);

  const chooseSuggestion = useCallback((fn) => {
    setLocalInput("=" + fn + "(");
    setSuggestions([]);
  }, []);

  const handleKeyDown = useCallback(async (e) => {
    if (e.key === "Enter" && selectedCell) {
      e.preventDefault();

      const raw = localInput;
      
      // Ensure activeSheet and workbookId are available
      if (!workbookId || !activeSheet) {
        console.error("Cannot save cell: workbookId or activeSheet is missing");
        return;
      }

      await axios.post(
        `http://localhost:5001/cells/${workbookId}/${activeSheet}/${selectedCell}`,
        {
          rawValue: raw,
        }
      );

      let computedValue = raw;

      if (raw.startsWith("=")) {
        try {
          // Get all cell values from Zustand store for formula evaluation
          const allCells = useCellStore.getState().cellValues;
          const formulaRes = await axios.post(
            "http://localhost:5002/evaluate",
            {
              cellId: selectedCell,
              rawValue: raw,
              allCells: allCells,
            }
          );
          computedValue = formulaRes.data.result;
        } catch {
          computedValue = "ERR";
        }
      }

      // Update Zustand store instead of context
      updateCell(selectedCell, raw, computedValue);

      setSuggestions([]);
      
      // Clear formula mode so clicking cells works normally
      setFormulaModeCell(null);
      
      // Blur the input to remove focus
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [selectedCell, localInput, workbookId, activeSheet, updateCell, setFormulaModeCell]);

  return (
    <div className="relative flex items-center w-full border bg-white">
      {/* fx symbol */}
      <div className="w-12 h-full flex items-center justify-center border-r text-green-700 text-xl">
        ƒx
      </div>

      <input
        ref={inputRef}
        type="text"
        value={localInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="p-3 w-full text-lg text-black"
      />

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute left-14 top-full mt-1 bg-white border shadow-xl w-[300px] z-50 max-h-60 overflow-auto">
          {suggestions.map(fn => (
            <div
              key={fn}
              className="text-black px-3 py-2 hover:bg-green-100 cursor-pointer"
              onClick={() => chooseSuggestion(fn)}
            >
              {fn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Memoize FormulaBar to prevent unnecessary rerenders
// It only rerenders when selectedCell changes (via Zustand selector)
export default memo(FormulaBar);
