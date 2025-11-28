"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Plus, FileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  const [workbooks, setWorkbooks] = useState([]);

  // Load all workbooks
  useEffect(() => {
    async function loadWorkbooks() {
      const res = await axios.get("http://localhost:5001/workbook");
      setWorkbooks(res.data);
    }
    loadWorkbooks();
  }, []);

  async function createWorkbook() {
    const name = `Workbook ${workbooks.length + 1}`;
    const res = await axios.post("http://localhost:5001/workbook", { name });
    setWorkbooks([...workbooks, res.data]);
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12 sm:px-8 sm:py-16">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Manage your workbooks and spreadsheets
            </p>
          </div>

          <button
            onClick={createWorkbook}
            className="cursor-pointer group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 active:scale-[0.98] w-full sm:w-auto"
          >
            
            <span>New Workbook</span>
          </button>
        </div>

        {/* WORKBOOKS SECTION */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">
            Your Workbooks
          </h2>

          {workbooks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <FileSpreadsheet size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">No workbooks yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first workbook to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {workbooks.map((wb) => {
                const displayDate = formatDate(wb.lastOpened || wb.createdAt);
                return (
                  <Link key={wb._id} href={`/workbook/${wb._id}`}>
                    <div className="group relative p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/70 hover:shadow-2xl hover:shadow-slate-300/40 hover:border-slate-300/90 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden">
                      <div className="flex items-start gap-2.5 mb-2.5 relative z-10">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform duration-300">
                          <FileSpreadsheet size={16} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate mb-0.5 group-hover:text-blue-600 transition-colors duration-200">
                            {wb.name}
                          </h3>
                          {displayDate && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              {displayDate}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Grid Preview */}
                      <div className="relative z-10 mt-2.5 pt-2.5 border-t border-slate-100">
                        <div className="grid grid-cols-4 gap-px bg-slate-100 p-0.5 rounded-sm">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-square bg-white rounded-sm border border-slate-100/80"
                              style={{ minHeight: '12px' }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Subtle hover indicator */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
