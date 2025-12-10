"use client";

import { useState, useRef, useCallback, useEffect, useContext, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GridContext } from "@/app/context/GridContext";
import axios from "axios";
import Cell from "./Cell";

/**
 * Convert number -> Excel column letters
 */
function colToLetter(num) {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export default function Grid() {
  const [columnLabels, setColumnLabels] = useState([]);
  const [colMenu, setColMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    colIndex: null,
  });

  const rows = 1000;
  // Default width for all columns
  const [colWidths, setColWidths] = useState([]);
  useEffect(() => {
    if (columnLabels.length > 0) {
      setColWidths((prev) => {
        // if widths already match, do nothing
        if (prev.length === columnLabels.length) return prev;

        // otherwise generate new widths
        const newWidths = [...prev];

        while (newWidths.length < columnLabels.length) {
          newWidths.push(120);
        }

        return newWidths;
      });
    }
  }, [columnLabels]);

  const { workbookId, activeSheet } = useContext(GridContext);
  
  // Memoize workbookId and activeSheet to prevent unnecessary rerenders
  const memoizedWorkbookId = useMemo(() => workbookId, [workbookId]);
  const memoizedActiveSheet = useMemo(() => activeSheet, [activeSheet]);

  useEffect(() => {
    if (!memoizedWorkbookId || !memoizedActiveSheet) return;

    axios
      .get(`http://localhost:5001/workbook/${memoizedWorkbookId}/sheets`)
      .then((res) => {
        const sheet = res.data.find((s) => s.name === memoizedActiveSheet);
        if (sheet) setColumnLabels(sheet.columnLabels);
      })
      .catch((err) => console.error("Load column labels error:", err));
  }, [memoizedWorkbookId, memoizedActiveSheet]);

  // Track resizing
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Mouse down on resizer
  const beginResize = (index, e) => {
    resizingCol.current = index;
    startX.current = e.clientX;
    startWidth.current = colWidths[index];

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  // Mouse move
  const handleResize = useCallback(
    (e) => {
      if (resizingCol.current === null) return;

      const diff = e.clientX - startX.current;
      const newWidth = Math.max(50, startWidth.current + diff); // min width 50px

      setColWidths((prev) => {
        const updated = [...prev];
        updated[resizingCol.current] = newWidth;
        return updated;
      });
    },
    []
  );

  // Mouse up
  const stopResize = () => {
    resizingCol.current = null;

    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  };

  // Create new columns
  const addColumnLeft = useCallback(async (index) => {
    if (!memoizedWorkbookId || !memoizedActiveSheet) return;
    
    const res = await axios.post(
      `http://localhost:5001/workbook/${memoizedWorkbookId}/sheets/${memoizedActiveSheet}/columns`,
      { index, direction: "left" }
    );

    setColumnLabels(res.data.columns);

    setColWidths((prev) => {
      const updated = [...prev];
      updated.splice(index, 0, 120);
      return updated;
    });
  }, [memoizedWorkbookId, memoizedActiveSheet]);

  const addColumnRight = useCallback(async (index) => {
    if (!memoizedWorkbookId || !memoizedActiveSheet) return;
    
    const res = await axios.post(
      `http://localhost:5001/workbook/${memoizedWorkbookId}/sheets/${memoizedActiveSheet}/columns`,
      { index, direction: "right" }
    );

    setColumnLabels(res.data.columns);

    setColWidths((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, 120);
      return updated;
    });
  }, [memoizedWorkbookId, memoizedActiveSheet]);

  function syncColumnWidths(totalColumns) {
    setColWidths((prev) => {
      const newWidths = [...prev];

      while (newWidths.length < totalColumns) {
        newWidths.push(120);
      }

      return newWidths;
    });
  }

  // Memoize column headers to prevent recreation on every render
  const columnHeaders = useMemo(() => 
    columnLabels.map((label, idx) => (
      <div
        key={label}
        className="table-cell h-10 border bg-gray-100 text-black font-bold text-center align-middle relative select-none"
        style={{ width: colWidths[idx], minWidth: colWidths[idx] }}
        onContextMenu={(e) => {
          e.preventDefault();
          setColMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            colIndex: idx,
          });
        }}
      >
        {label}

        {/* Resize handle */}
        <div
          onMouseDown={(e) => beginResize(idx, e)}
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-300"
        ></div>
      </div>
    )), [columnLabels, colWidths]
  );

  const headerRow = useMemo(() => (
    <div className="table-row">
      <div className="table-cell w-10 h-10 border bg-gray-200"></div>
      {columnHeaders}
    </div>
  ), [columnHeaders]);

  // Virtualization setup
  const parentRef = useRef(null);
  const rowHeight = 40; // h-10 = 40px
  
  // Calculate total width for horizontal scrolling
  const totalWidth = useMemo(() => {
    return 40 + colWidths.reduce((sum, width) => sum + (width || 120), 0);
  }, [colWidths]);
  
  // Calculate column positions for horizontal scrolling
  const columnPositions = useMemo(() => {
    const positions = [0]; // Row label column at 0
    let currentPos = 40; // Start after row label
    for (let i = 0; i < columnLabels.length; i++) {
      positions.push(currentPos);
      currentPos += colWidths[i] || 120;
    }
    return positions;
  }, [columnLabels.length, colWidths]);

  // Row virtualizer - only renders visible rows
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10, // Render 10 extra rows above/below for smooth scrolling
  });

  // Calculate visible column range based on scroll position
  const [scrollState, setScrollState] = useState({ scrollLeft: 0, clientWidth: 1000 });
  
  const handleScroll = useCallback((e) => {
    const target = e.target;
    setScrollState({
      scrollLeft: target.scrollLeft,
      clientWidth: target.clientWidth || 1000
    });
  }, []);

  // Calculate visible columns based on scroll position
  const visibleColumnRange = useMemo(() => {
    const { scrollLeft, clientWidth } = scrollState;
    let start = 0;
    let end = columnLabels.length;
    
    if (columnLabels.length === 0) {
      return { start: 0, end: 0 };
    }
    
    // Find which columns are visible with buffer
    const buffer = 500; // Render 500px before/after viewport for smooth scrolling
    for (let i = 0; i < columnPositions.length - 1; i++) {
      if (columnPositions[i + 1] > scrollLeft - buffer) {
        start = Math.max(0, i - 1);
        break;
      }
    }
    
    for (let i = start; i < columnPositions.length - 1; i++) {
      if (columnPositions[i] > scrollLeft + clientWidth + buffer) {
        end = i + 1;
        break;
      }
    }
    
    return { start, end: Math.min(end, columnLabels.length) };
  }, [scrollState, columnPositions, columnLabels.length]);

  // Initialize scroll state on mount and when container size changes
  useEffect(() => {
    const updateScrollState = () => {
      if (parentRef.current) {
        setScrollState({
          scrollLeft: parentRef.current.scrollLeft,
          clientWidth: parentRef.current.clientWidth || 1000
        });
      }
    };
    
    updateScrollState();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateScrollState);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div 
        ref={parentRef}
        className="overflow-auto w-full"
        onScroll={handleScroll}
        style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        {/* Fixed header row */}
        <div 
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'white',
            width: totalWidth,
            height: 40
          }}
        >
          <div 
            className="h-10 border bg-gray-200" 
            style={{ 
              position: 'absolute',
              left: 0,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          ></div>
          {columnHeaders.map((header, idx) => (
            <div 
              key={header.key || idx} 
              style={{ 
                position: 'absolute', 
                left: columnPositions[idx + 1], 
                width: colWidths[idx] || 120,
                height: 40
              }}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Virtualized content container */}
        <div 
          style={{ 
            width: totalWidth,
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative'
          }}
        >
          {/* Virtualized rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = virtualRow.index + 1; // Rows are 1-indexed
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Row label - fixed position */}
                <div
                  className="table-cell h-10 border bg-gray-100 text-black font-bold text-center align-middle"
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {row}
                </div>

                {/* Visible cells for this row */}
                {Array.from({ length: visibleColumnRange.end - visibleColumnRange.start }, (_, idx) => {
                  const col = visibleColumnRange.start + idx + 1; // Columns are 1-indexed
                  const colIdx = visibleColumnRange.start + idx;
                  return (
                    <div
                      key={`r${row}c${col}`}
                      style={{
                        position: 'absolute',
                        left: columnPositions[colIdx + 1],
                        width: colWidths[colIdx] || 120,
                        height: 40
                      }}
                    >
                      <Cell row={row} col={col} width={colWidths[colIdx] || 120} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right-click menu */}
      {colMenu.visible && (
        <div
          className="fixed bg-white shadow-lg border rounded text-sm z-50"
          style={{ top: colMenu.y, left: colMenu.x }}
        >
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700"
            onClick={() => {
              addColumnLeft(colMenu.colIndex);
              setColMenu({ ...colMenu, visible: false });
            }}
          >
            Insert column left
          </button>

          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-700"
            onClick={() => {
              addColumnRight(colMenu.colIndex);
              setColMenu({ ...colMenu, visible: false });
            }}
          >
            Insert column right
          </button>
        </div>
      )}
    </>
  );
}
