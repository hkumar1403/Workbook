"use client";

import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GridContext } from "@/app/context/GridContext"; // <-- IMPORTANT

export default function SheetTabs({ onSheetChange }) {
  const [sheets, setSheets] = useState([]);   // <--- CHANGED: start empty
  const [activeSheet, setActiveSheet] = useState(null);
  const scrollRef = useRef(null);

  const { workbookId } = useContext(GridContext); // <--- IMPORTANT: get workbook ID

  // ------------------------------------------------------------
  // 1️⃣ LOAD SHEETS FROM BACKEND
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadSheets() {
      if (!workbookId) return;

      const res = await axios.get(
        `http://localhost:5001/workbook/${workbookId}/sheets`
      );

      setSheets(res.data);
      setActiveSheet(res.data[0]);            // first sheet active
      onSheetChange?.(res.data[0]);
    }

    loadSheets();
  }, [workbookId]);

  // ------------------------------------------------------------
  // 2️⃣ ADD NEW SHEET → SAVE TO BACKEND
  // ------------------------------------------------------------
  const addSheet = async () => {
    const newName = `Sheet${sheets.length + 1}`;

    // Save to backend
    const res = await axios.post(
      `http://localhost:5001/workbook/${workbookId}/sheets`,
      { sheetName: newName }
    );

    const updated = res.data;  // backend returns updated sheets array

    setSheets(updated);
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
        {sheets.map((sheet) => (
          <button
            key={sheet}
            onClick={() => selectSheet(sheet)}
            className={`cursor-pointer px-3 py-1 rounded border text-sm transition-all
              ${
                activeSheet === sheet
                  ? "bg-blue-500 hover:bg-blue-600 border-gray-400 text-white"
                  : "bg-white border-gray-300 hover:bg-gray-100 text-black"
              }
            `}
          >
            {sheet}
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
    </div>
  );
}
