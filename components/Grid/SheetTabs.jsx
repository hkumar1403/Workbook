"use client";

import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GridContext } from "@/app/context/GridContext"; // <-- IMPORTANT
import SheetMenu from "../SheetMenu";
export default function SheetTabs({ onSheetChange }) {
  const [sheets, setSheets] = useState([]); // <--- CHANGED: start empty
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [clickedSheet, setClickedSheet] = useState(null);

  const [renamingSheet, setRenamingSheet] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);

  const scrollRef = useRef(null);
  const sheetsLoadedRef = useRef(new Map()); // Track loaded state per workbookId

  const { workbookId, activeSheet, setActiveSheet } = useContext(GridContext); // <--- IMPORTANT: get workbook ID and activeSheet from context

  // ------------------------------------------------------------
  // 1️⃣ LOAD SHEETS FROM BACKEND
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadSheets() {
      if (!workbookId) return;

      // Check if sheets are already loaded for this workbookId
      if (sheetsLoadedRef.current.get(workbookId)) return;

      try {
        const res = await axios.get(
          `http://localhost:5001/workbook/${workbookId}/sheets`
        );

        // Backend returns an array of sheet names: ["Sheet1", "Sheet2", ...]
        const sheetNames = Array.isArray(res.data) ? res.data : [];

        // Normalize objects → plain string names
        const normalized = sheetNames.map((s) =>
          typeof s === "string" ? s : s.name
        );

        setSheets(normalized);
        sheetsLoadedRef.current.set(workbookId, true);

        // Set first sheet as active if available and not already set
        if (normalized.length > 0 && !activeSheet) {
          const firstName = normalized[0];
          setActiveSheet(firstName);
          onSheetChange?.(firstName);
        }
      } catch (err) {
        // If 404, workbook doesn't exist - just return early
        // GridContext will handle reinitialization
        if (err.response?.status === 404) {
          setSheets([]);
          sheetsLoadedRef.current.delete(workbookId);
          // Do NOT trigger reinitialization here - let GridContext handle it
          return;
        } else {
          console.error("Error loading sheets:", err);
        }
      }
    }

    loadSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbookId]); // Only depend on workbookId - setActiveSheet is stable

  // ------------------------------------------------------------
  // 2️⃣ ADD NEW SHEET → SAVE TO BACKEND
  // ------------------------------------------------------------
  const addSheet = async () => {
    const newName = `Sheet${sheets.length + 1}`;
    console.log(
      "Calling:",
      `http://localhost:5001/workbook/${workbookId}/sheets`
    );

    // Save to backend
    const res = await axios.post(
      `http://localhost:5001/workbook/${workbookId}/sheets`,
      { sheetName: newName }
    );

    const updated = res.data; // backend returns updated sheets array
    const normalized = updated.map((s) =>
      typeof s === "string" ? s : s.name
    );

    setSheets(normalized);
    setActiveSheet(newName);
    onSheetChange?.(newName);
  };

  // ------------------------------------------------------------
  // 3️⃣ CHANGE ACTIVE SHEET
  // ------------------------------------------------------------
  const selectSheet = (name) => {
    setActiveSheet(name);
    onSheetChange?.(name);
  };

  // ------------------------------------------------------------
  // 4️⃣ RENDER
  // ------------------------------------------------------------

  // SHOW RENAME AND DELETE MENU
  const openContextMenu = (e, sheet) => {
    e.preventDefault();
    setClickedSheet(sheet);
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const startRename = () => {
    setRenamingSheet(clickedSheet);
    setRenameValue(clickedSheet);
    setMenuOpen(false);
  };

  const finishRename = async (oldName) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) {
      setRenamingSheet(null);
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5001/workbook/${workbookId}/sheets/rename`,
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
  };

  const startDelete = () => {
    setConfirmDelete(clickedSheet);
    setMenuOpen(false);
  };

  const deleteSheet = async () => {
    try {
      const res = await axios.delete(
        `http://localhost:5001/workbook/${workbookId}/sheets/${confirmDelete}`
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
  };

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
