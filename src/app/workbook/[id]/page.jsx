"use client";

import { useParams } from "next/navigation";
import { useContext, useState, useEffect } from "react";
import FormulaBar from "../../../../components/FormulaBar";
import Grid from "../../../../components/Grid/Grid";
import Sidebar from "../../../../components/Grid/Sidebar";
import SheetTabs from "../../../../components/Grid/SheetTabs";
import { GridContext } from "@/app/context/GridContext";
import { Menu } from "lucide-react";
import UploadCSV from "../../../../components/UploadCSV";

export default function WorkbookPage() {
  const { id } = useParams();
  const { setWorkbookId } = useContext(GridContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setWorkbookId(id);
    }
  }, [id, setWorkbookId]);

  return (
    <div className="w-full min-h-screen bg-white relative">
      {/* TOP BAR */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <h1 className="text-xl font-serif font-bold text-gray-700">Astrel</h1>

        <div className="flex items-center gap-3">
          {/* Upload CSV Button */}
          <UploadCSV />

          {/* Menu Icon */}
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu
              size={20}
              className="text-gray-700 cursor-pointer"
              strokeWidth={1.2}
            />
          </button>
        </div>
      </div>

      <FormulaBar />
      <Grid />

      {/* Sheet Tabs at the bottom */}
      <SheetTabs />

      {/* Sidebar Modal */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
