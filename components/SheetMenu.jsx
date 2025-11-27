"use client";

import { useEffect, useRef, useState } from "react";

export default function SheetMenu({
  position,
  sheetName,
  onRename,
  onDelete,
  closeMenu,
}) {
  const menuRef = useRef(null);
  const [calculatedTop, setCalculatedTop] = useState(position.y);
  // Close menu if user clicks outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [closeMenu]);

  useEffect(() => {
    const height = menuRef.current?.offsetHeight || 100;
    setCalculatedTop(position.y - height);
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="
        fixed bg-white 
        shadow-lg rounded-md border border-gray-300 
        w-40 z-[9999] select-none
        animate-fade
      "
      style={{
        top: calculatedTop,
        left: position.x,
      }}
    >
      <button
        onClick={() => {
          onRename(sheetName);
          closeMenu();
        }}
        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-black cursor-pointer"
      >
        Rename
      </button>

      <button
        onClick={() => {
          onDelete(sheetName);
          closeMenu();
        }}
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
      >
        Delete
      </button>
    </div>
  );
}
