"use client";

import axios from "axios";
import { useContext, useState, useEffect } from "react";
import { GridContext } from "@/app/context/GridContext";

export default function FormulaBar() {
  const { selectedCell, cellValues, setCellValues } = useContext(GridContext);

  const [localInput, setLocalInput] = useState("");

  // Load selected cell's raw value into the bar
  useEffect(() => {
    if (selectedCell) {
      setLocalInput(cellValues[selectedCell] || "");
    }
  }, [selectedCell, cellValues]);

  async function handleKeyDown(e) {
    if (e.key === "Enter" && selectedCell) {
      const raw = localInput;

      // 1️⃣ Save raw value into cell-service
      await axios.post(`http://localhost:5001/cells/sheet1/${selectedCell}`, {
        rawValue: raw,
      });

      let computedValue = raw;

      // 2️⃣ If formula, compute via formula-service
      console.log("Sending allCells to formula service:", cellValues);
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
        } catch (err) {
          console.log("Formula error:", err);
          computedValue = "ERR";
        }
      }

      // 3️⃣ Save raw + computed value to UI state
      setCellValues({
        ...cellValues,
        [selectedCell]: raw,
        [`${selectedCell}_value`]: computedValue,
      });
    }
  }

  return (
    <input
      type="text"
      placeholder={selectedCell ? "" : "Select a cell..."}
      value={localInput}
      onChange={(e) => setLocalInput(e.target.value)}
      onKeyDown={handleKeyDown}
      className="border p-3 w-full text-lg"
    />
  );
}
