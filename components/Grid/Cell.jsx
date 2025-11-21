"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { GridContext } from "@/app/context/GridContext"; // adjust path if needed

// Convert number → Excel letters
function colToLetter(num) {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export default function Cell({ row, col, width }) {
  const {
    selectedCell,
    setSelectedCell,
    allCells,
    setCellRawValue,
    getCellDisplayValue,
  } = useContext(GridContext);

  const cellId = `${colToLetter(col)}${row}`;
  const isSelected = selectedCell === cellId;

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  // When selection changes: if this cell becomes selected, don't automatically edit.
  // Editing enters on double-click (Excel-style).
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  // When entering edit mode, populate input with raw value and focus
  useEffect(() => {
    if (isEditing && isSelected) {
      setInputVal(allCells?.[cellId] ?? "");
      // focus next tick
      setTimeout(() => inputRef.current?.focus(), 0);
      // place caret at end
      setTimeout(() => {
        const el = inputRef.current;
        if (el && typeof el.setSelectionRange === "function") {
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 10);
    }
  }, [isEditing, isSelected, allCells, cellId]);

  // Start editing on double click
  const handleDoubleClick = () => {
    setSelectedCell(cellId);
    setIsEditing(true);
  };

  // Start editing if user types while selected (optional excel-like behavior)
  // (If you want this, uncomment. For strict Excel double-click only, leave commented.)
  /*
  useEffect(() => {
    function onKey(e) {
      if (isSelected && !isEditing) {
        // ignore navigation keys
        if (e.key.length === 1 || e.key === "Backspace") {
          setInputVal(e.key === "Backspace" ? "" : e.key);
          setIsEditing(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSelected, isEditing]);
  */

  const finishEdit = () => {
    // save raw string into global store
    setCellRawValue(cellId, inputVal);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setInputVal(allCells?.[cellId] ?? "");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      finishEdit();
      // optional: move selection down one row
      // setSelectedCell(nextCellId); // implement if desired
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div
      className={
        "table-cell h-10 border text-black align-middle overflow-hidden relative " +
        (isSelected ? "bg-green-200 border-blue-400" : "bg-white")
      }
      style={{ width }}
      onClick={() => {
        if (!isEditing) setSelectedCell(cellId);
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing && isSelected ? (
        <input
          ref={inputRef}
          className="w-full h-full px-1 outline-none bg-white"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <div className="w-full h-full px-1 whitespace-nowrap overflow-hidden text-left">
          {getCellDisplayValue(cellId)}
        </div>
      )}
    </div>
  );
}

