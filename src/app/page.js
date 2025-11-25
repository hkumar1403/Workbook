"use client";

import Link from "next/link";
import FormulaBar from "../../components/FormulaBar";
import Grid from "../../components/Grid/Grid";
import Sidebar from "../../components/Grid/Sidebar";
import SheetTabs from "../../components/Grid/SheetTabs";
import axios from "axios";
import { useContext, useState } from "react";
import { GridContext } from "@/app/context/GridContext";
import { Menu } from "lucide-react";

export default function Page() {
  const { sheetId, setCellValues } = useContext(GridContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function reloadSheet() {
    const res = await axios.get(`http://localhost:5001/cells/${sheetId}`);
    setCellValues(res.data);
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      {/* TOP BAR */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <h1 className="text-xl font-serif font-bold text-gray-700">Astrel</h1>

        {/* Menu Icon */}
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu
            size={20}
            className="text-gray-700 cursor-pointer"
            strokeWidth={1.2}
          />
        </button>
      </div>

      <FormulaBar />
      <Grid />

      {/* ADD THIS — Sheet Tabs at the bottom */}
      <SheetTabs />

      {/* Sidebar Modal */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
