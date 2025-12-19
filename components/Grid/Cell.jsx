"use client";

import { useContext, useEffect, useRef, useState, useCallback, memo } from "react";
import { GridContext } from "@/app/context/GridContext";
import { useCellStore, useCellDisplayValue, useCellRawValue } from "@/app/store/cellStore";
import axios from "axios";

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

// helper: convert "A".."Z","AA" -> number (1-indexed)
function letterToCol(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n;
}

// helper: parse cellId like "B12" -> { colLetters: "B", col: 2, row: 12 }
function parseCellId(cellId) {
  const m = cellId.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const letters = m[1];
  const row = parseInt(m[2], 10);
  return { colLetters: letters, col: letterToCol(letters), row };
}

// helper: build cellId
function buildCellId(colNum, row) {
  return `${colToLetter(colNum)}${row}`;
}

function Cell({ row, col, width }) {
  const {
    selectedCell,
    setSelectedCell,
    workbookId,
    activeSheet,

    // new formula support from GridContext
    formulaModeCell,
    setFormulaModeCell,
    formulaCursor,
    setFormulaCursor,
    insertCellReferenceIntoFormula,
  } = useContext(GridContext);

  const cellId = `${colToLetter(col)}${row}`;
  const isSelected = selectedCell === cellId;

  // Use optimized Zustand selectors to only subscribe to this cell's value
  // These hooks only rerender when THIS specific cell's value changes
  const cellDisplayValue = useCellDisplayValue(cellId);
  const cellRawValue = useCellRawValue(cellId);
  const updateCell = useCellStore((state) => state.updateCell);

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  // When selection changes: if this cell becomes selected, don't automatically edit.
  // Editing enters on click (currently single-click opens editor in your app)
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false); // exit edit when losing selection
    }
  }, [isSelected]);

  // Start editing when this cell receives the lightweight 'start-edit' event
  useEffect(() => {
    function onStartEdit(e) {
      const target = e?.detail;
      if (target === cellId) {
        setSelectedCell(cellId);
        setIsEditing(true);
        // small delay to ensure input DOM mounted
        setTimeout(() => {
          inputRef.current?.focus();
          // place caret at end if possible
          const el = inputRef.current;
          if (el && typeof el.setSelectionRange === "function") {
            el.setSelectionRange(el.value.length, el.value.length);
          }
        }, 0);
      }
    }
    window.addEventListener("start-edit", onStartEdit);
    return () => window.removeEventListener("start-edit", onStartEdit);
  }, [cellId, setSelectedCell]);

  // Keep in sync with cellRawValue on entering edit mode
  useEffect(() => {
    if (isEditing && isSelected) {
      setInputVal(cellRawValue ?? "");
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
  }, [isEditing, isSelected, cellRawValue]);

  const finishEdit = useCallback(async () => {
    if (!workbookId || !activeSheet) {
      console.error("Cannot save cell: workbookId or activeSheet is missing");
      setIsEditing(false);
      return;
    }

    try {
      await axios.post(
        `https://workbook-gc93.onrender.com/cells/${workbookId}/${activeSheet}/${cellId}`,
        { rawValue: inputVal }
      );
    } catch (err) {
      console.error("Error saving cell:", err);
    }

    // Update Zustand store
    updateCell(cellId, inputVal);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cell-updated"));
    }

    setIsEditing(false);
  }, [workbookId, activeSheet, cellId, inputVal, updateCell]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setInputVal(cellRawValue ?? "");
  }, [cellRawValue]);

  // Compute neighbor cell ids
  function nextCellRightId() {
    return buildCellId(col + 1, row);
  }
  function nextCellLeftId() {
    return buildCellId(Math.max(1, col - 1), row);
  }
  function nextCellDownId() {
    return buildCellId(col, row + 1);
  }
  function nextCellUpId() {
    return buildCellId(col, Math.max(1, row - 1));
  }

  const onKeyDown = useCallback(async (e) => {
    // Allow '=' to be typed normally (do not intercept)
    if (e.key === "=") {
      return;
    }

    if (e.key === "Escape") {
      cancelEdit();
      return;
    }

    if (e.key === "Enter") {
      // commit then move down & open editor
      e.preventDefault();
      
      // Blur the current input before finishing edit
      if (inputRef.current) {
        inputRef.current.blur();
      }
      
      await finishEdit();
      const next = e.shiftKey ? nextCellUpId() : nextCellDownId();
      setSelectedCell(next);
      // signal that next cell should open its editor
      window.dispatchEvent(new CustomEvent("start-edit", { detail: next }));
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      await finishEdit();
      const next = e.shiftKey ? nextCellLeftId() : nextCellRightId();
      setSelectedCell(next);
      window.dispatchEvent(new CustomEvent("start-edit", { detail: next }));
      return;
    }
  }, [cancelEdit, finishEdit, setSelectedCell]);

  // When clicking this cell:
  // - if a formula is being edited in another cell, insert a ref instead of switching editor
  const handleClick = useCallback((e) => {
    // If another cell is being edited AND it is a formula → insert reference instead of selecting
    if (formulaModeCell && formulaModeCell !== cellId) {
      e.preventDefault();
      e.stopPropagation();
      insertCellReferenceIntoFormula(cellId);
      return;
    }

    // Normal behavior (select + edit this cell)
    setSelectedCell(cellId);
    setIsEditing(true);
  }, [formulaModeCell, cellId, insertCellReferenceIntoFormula, setSelectedCell]);

  // While editing: keep track of caret selection so insertions can be placed at cursor
  const handleSelectOrKeyUp = useCallback((e) => {
    if (!inputRef.current) return;
    try {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      setFormulaCursor({ start, end });
    } catch {
      // ignore if unavailable
    }
  }, [setFormulaCursor]);

  // Listen for formula-inserted event to re-focus & set selection in this input if it's the active formula cell
  useEffect(() => {
    function onFormulaInserted(e) {
      const d = e?.detail;
      if (!d) return;
      if (d.cellId === cellId && isEditing) {
        // re-sync DOM input value from Zustand store + set selection
        setTimeout(() => {
          const el = inputRef.current;
          if (el) {
            // sync displayed value from store (it should already be synced via Zustand update)
            const currentRaw = useCellStore.getState().getCellRaw(cellId);
            el.value = currentRaw ?? el.value;
            if (typeof el.setSelectionRange === "function" && d.cursor) {
              el.setSelectionRange(d.cursor.start, d.cursor.end);
              setFormulaCursor({ start: d.cursor.start, end: d.cursor.end });
            }
            el.focus();
          }
        }, 0);
      }
    }
    window.addEventListener("formula-inserted", onFormulaInserted);
    return () => window.removeEventListener("formula-inserted", onFormulaInserted);
  }, [cellId, isEditing, setFormulaCursor]);

  // Check if this cell is being selected for formula reference
  const isSelectedForFormula = formulaModeCell && formulaModeCell !== cellId && isSelected;

  return (
    <div
      className={
        "table-cell h-10 border text-black align-middle overflow-hidden relative " +
        (isSelectedForFormula 
          ? "bg-green-200 border-purple-500 border-2" 
          : isSelected 
            ? "bg-green-200 border-blue-400" 
            : "bg-white")
      }
      style={{ width }}
      onClick={handleClick}
    >
      {isEditing && isSelected ? (
        <input
          ref={inputRef}
          className="w-full h-full px-1 outline-none bg-white"
          value={inputVal}
          onChange={(e) => {
            const newVal = e.target.value;
            setInputVal(newVal);

            // detect formula mode AFTER "=" is typed (so "=" inserts normally)
            if (newVal && newVal.startsWith("=")) {
              setFormulaModeCell(cellId);
            } else if (formulaModeCell === cellId && !newVal.startsWith("=")) {
              // exit formula mode if user removed '='
              setFormulaModeCell(null);
              setFormulaCursor(null);
            }
          }}
          onSelect={handleSelectOrKeyUp}
          onKeyUp={handleSelectOrKeyUp}
          onBlur={finishEdit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <div className="w-full h-full px-1 whitespace-nowrap overflow-hidden text-left">
          {cellDisplayValue}
        </div>
      )}
    </div>
  );
}

// Memoize Cell to prevent unnecessary rerenders
// Cell only rerenders when:
// 1. Its own value changes (via Zustand selector)
// 2. Selection/editing state changes (via context)
// 3. Props change (row, col, width)
export default memo(Cell);
