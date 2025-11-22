"use client";

import axios from "axios";
import { useContext, useState, useEffect } from "react";
import { GridContext } from "@/app/context/GridContext";
import * as fjs from "formulajs";

export default function FormulaBar() {
  const { selectedCell, cellValues, setCellValues } = useContext(GridContext);

  const [localInput, setLocalInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const FUNCTION_NAMES = Object.keys(fjs).map(fn => fn.toUpperCase()).sort();

  // Load selected cell raw value
  useEffect(() => {
    if (selectedCell) {
      setLocalInput(cellValues[selectedCell] || "");
      setSuggestions([]);
    }
  }, [selectedCell, cellValues]);

  function handleChange(e) {
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
  }

  function chooseSuggestion(fn) {
    setLocalInput("=" + fn + "(");
    setSuggestions([]);
  }

  async function handleKeyDown(e) {
    if (e.key === "Enter" && selectedCell) {
      const raw = localInput;

      await axios.post(`http://localhost:5001/cells/sheet1/${selectedCell}`, {
        rawValue: raw,
      });

      let computedValue = raw;

      if (raw.startsWith("=")) {
        try {
          const formulaRes = await axios.post(
            "http://localhost:5002/evaluate",
            {
              cellId: selectedCell,
              rawValue: raw,
              allCells: cellValues,
            }
          );
          computedValue = formulaRes.data.result;
        } catch {
          computedValue = "ERR";
        }
      }

      setCellValues({
        ...cellValues,
        [selectedCell]: raw,
        [`${selectedCell}_value`]: computedValue,
      });

      setSuggestions([]);
    }
  }

  return (
    <div className="relative flex items-center w-full border bg-white">
      {/* fx symbol */}
      <div className="w-12 h-full flex items-center justify-center border-r text-green-700 text-xl">
        ƒx
      </div>

      <input
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
