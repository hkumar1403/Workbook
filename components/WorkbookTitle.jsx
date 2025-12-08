"use client";

import { useContext, useState } from "react";
import { GridContext } from "@/app/context/GridContext";

export default function WorkbookTitle() {
  const { workbookName, renameWorkbook } = useContext(GridContext);

  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(workbookName);

  const finishRename = () => {
    if (tempName.trim() !== "") {
      renameWorkbook(tempName);
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 text-gray-700 font">
      {editing ? (
        <input
          autoFocus
          className="border px-2 py-1 rounded"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={finishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") finishRename();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <span
          className="font-bold text-lg px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:text-white cursor-pointer max-w-[220px] truncate"
          onClick={() => {
            setTempName(workbookName);
            setEditing(true);
          }}
        >
          {workbookName}
        </span>
      )}
    </div>
  );
}