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
    <div className="flex items-center w-full border bg-white">
      {/* fx symbol box */}
      <div className="w-12 h-full flex items-center justify-center border-r text-green-700 text-xl">
        ƒx
      </div>

      {/* actual formula input */}
      <input
        type="text"
        placeholder=""
        value={localInput}
        onChange={(e) => setLocalInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="p-3 w-full text-lg outline- text-black"
      />
    </div>
  );
}
