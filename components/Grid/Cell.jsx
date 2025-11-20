"use client";

import { useContext } from "react";
import { GridContext } from "@/app/context/GridContext";

// Convert 1 → A, 2 → B, 27 → AA
function colToLetter(num) {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export default function Cell({ row, col }) {
  const { selectedCell, setSelectedCell, getCellDisplayValue } =
    useContext(GridContext);

  const cellId = `${colToLetter(col)}${row}`;
  const isSelected = selectedCell === cellId;

  return (
    <div
      className={
        (isSelected ? "bg-green-200 border-red-50" : "bg-white border") +
        " w-20 h-10 flex items-center justify-center text-black"
      }
      onClick={() => setSelectedCell(cellId)}
    >
      {getCellDisplayValue(cellId)}
    </div>
  );
}
