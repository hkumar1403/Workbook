"use client";

import { User, LayoutDashboard, Sigma, SquareChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

const Tooltip = ({ label, children }) => (
  <div className="relative group flex items-center justify-center">
    {children}

    <span
      className="
      absolute right-full ml-2
      px-2 py-1
      text-xs text-white 
      bg-gray-700 
      rounded 
      opacity-0 group-hover:opacity-100 
      transition-opacity duration-150
      whitespace-nowrap
      pointer-events-none
    "
    >
      {label}
    </span>
  </div>
);

export default function Sidebar({ isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade + slide animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay for animation
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/20 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Sidebar */}
      <div
        className={`relative h-full w-16 bg-white shadow-lg border-r border-gray-200 flex flex-col justify-between items-center py-6 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }

        }`}
      >
        {/* TOP ICONS */}
        <div className="flex flex-col gap-7 items-center">
          <Tooltip label="Account">
            <User
              size={22}
              className="text-gray-700 cursor-pointer"
              strokeWidth={1.2}
            />
          </Tooltip>
          <Tooltip label="Dashboard">
            <LayoutDashboard
              size={22}
              className="text-gray-700 cursor-pointer"
              strokeWidth={1.2}
            />
          </Tooltip>
          <Tooltip label="Formulas">
            <Link href="/formulas">
              <Sigma
                size={22}
                className="text-gray-700 cursor-pointer"
                strokeWidth={1.2}
              />
            </Link>
          </Tooltip>
        </div>

        {/* BOTTOM ICON */}
        <SquareChevronRight
          size={22}
          strokeWidth={1.2}
          className="text-gray-700 cursor-pointer"
          onClick={onClose}
        />
      </div>
    </div>
  );
}
