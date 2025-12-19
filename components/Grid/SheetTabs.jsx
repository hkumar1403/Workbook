"use client";

import { useState, useRef, useEffect, useContext, useCallback, memo } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GridContext } from "@/app/context/GridContext"; // <-- IMPORTANT
import SheetMenu from "../SheetMenu";

function SheetTabs({ onSheetChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [clickedSheet, setClickedSheet] = useState(null);

  const [renamingSheet, setRenamingSheet] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);

  const scrollRef = useRef(null);

  const { workbookId, activeSheet, setActiveSheet, sheets, setSheets } = useContext(GridContext);

  // ------------------------------------------------------------
  // 2️⃣ ADD NEW SHEET → SAVE TO BACKEND
  // ------------------------------------------------------------
  const addSheet = useCallback(async () => {
    if (!workbookId) return;
    
    const newName = `Sheet${sheets.length + 1}`;
    console.log(
      "Calling:",
      `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets`
    );

    // Save to backend
    const res = await axios.post(
      `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets`,
      { sheetName: newName }
    );

    const updated = res.data; // backend returns updated sheets array
    const normalized = updated.map((s) =>
      typeof s === "string" ? s : s.name
    );

    setSheets(normalized);
    setActiveSheet(newName);
    onSheetChange?.(newName);
  }, [workbookId, sheets.length, setSheets, setActiveSheet, onSheetChange]);

  // ------------------------------------------------------------
  // 3️⃣ CHANGE ACTIVE SHEET
  // ------------------------------------------------------------
  const selectSheet = useCallback((name) => {
    setActiveSheet(name);
    onSheetChange?.(name);
  }, [setActiveSheet, onSheetChange]);

  // ------------------------------------------------------------
  // 4️⃣ RENDER
  // ------------------------------------------------------------

  // SHOW RENAME AND DELETE MENU
  const openContextMenu = useCallback((e, sheet) => {
    e.preventDefault();
    setClickedSheet(sheet);
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const startRename = useCallback(() => {
    setRenamingSheet(clickedSheet);
    setRenameValue(clickedSheet);
    setMenuOpen(false);
  }, [clickedSheet]);

  const finishRename = useCallback(async (oldName) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) {
      setRenamingSheet(null);
      return;
    }

    if (!workbookId) return;

    try {
      const res = await axios.put(
        `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets/rename`,
        { oldName, newName }
      );

      const updated = res.data; // backend returns updated sheet list
      const normalized = updated.map((s) =>
        typeof s === "string" ? s : s.name
      );
      setSheets(normalized);

      if (activeSheet === oldName) {
        setActiveSheet(newName);
      }
    } catch (err) {
      console.error("Rename error:", err);
    }

    setRenamingSheet(null);
  }, [workbookId, renameValue, activeSheet, setSheets, setActiveSheet]);

  const startDelete = useCallback(() => {
    setConfirmDelete(clickedSheet);
    setMenuOpen(false);
  }, [clickedSheet]);

  const deleteSheet = useCallback(async () => {
    if (!workbookId || !confirmDelete) return;

    try {
      const res = await axios.delete(
        `https://workbook-gc93.onrender.com/workbook/${workbookId}/sheets/${confirmDelete}`
      );

      const updated = res.data; // backend returns updated sheet list
      const normalized = updated.map((s) =>
        typeof s === "string" ? s : s.name
      );
      setSheets(normalized);

      if (activeSheet === confirmDelete) {
        setActiveSheet(normalized[0] || null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }

    setConfirmDelete(null);
  }, [workbookId, confirmDelete, activeSheet, setSheets, setActiveSheet]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center px-3 py-2 select-none">
      {/* Left Scroll Button */}
      <button
        className="p-1 hover:bg-gray-100 rounded"
        onClick={() =>
          scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" })
        }
      >
        <ChevronLeft size={18} className="text-gray-700 cursor-pointer" />
      </button>

      {/* Sheets List */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide mx-2 flex-1"
      >
        {sheets.map((sheetName) => (
          <button
            key={sheetName}
            onClick={() => selectSheet(sheetName)}
            onContextMenu={(e) => openContextMenu(e, sheetName)}
            className={`cursor-pointer px-3 py-1 rounded border text-sm transition-all
      ${
        activeSheet === sheetName
          ? "bg-blue-500 hover:bg-blue-600 border-gray-400 text-white"
          : "bg-white border-gray-300 hover:bg-gray-100 text-black"
      }
    `}
          >
            {renamingSheet === sheetName ? (
              <input
                className="bg-white m-0 w-20 border rounded outline-none text-black"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => finishRename(sheetName)}
                onKeyDown={(e) => e.key === "Enter" && finishRename(sheetName)}
              />
            ) : (
              sheetName
            )}
          </button>
        ))}
      </div>

      {/* Add Sheet Button */}
      <button
        onClick={addSheet}
        className="p-1 hover:bg-gray-100 rounded cursor-pointer"
        title="Add Sheet"
      >
        <Plus size={18} className="text-gray-700 cursor-pointer" />
      </button>

      {/* Right Scroll Button */}
      <button
        className="p-1 hover:bg-gray-100 rounded"
        onClick={() =>
          scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" })
        }
      >
        <ChevronRight size={18} className="text-gray-700 cursor-pointer" />
      </button>
      {menuOpen && (
        <SheetMenu
          position={menuPosition}
          sheetName={clickedSheet}
          onRename={startRename}
          onDelete={startDelete}
          closeMenu={() => setMenuOpen(false)}
        />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white p-5 rounded shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-2 text-gray-600">
              Delete Sheet?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to delete <b>{confirmDelete}</b>. This cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-black px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={deleteSheet}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize SheetTabs to prevent unnecessary rerenders
export default memo(SheetTabs);
