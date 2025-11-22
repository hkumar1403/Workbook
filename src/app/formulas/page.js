"use client";

import * as fjs from "formulajs";
import { useState } from "react";

export default function FormulaDocsPage() {
  const functionNames = Object.keys(fjs).sort(); //alphabetical order

  const [search, setSearch] = useState("");

  const filtered = functionNames.filter((fn) =>
    fn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold font-sans mb-6 text-gray-900">
         Formula Reference
      </h1>

      <p className="text-gray-600 mb-6">
        All functions available in <code>formulajs</code>, displayed
        alphabetically. Click a function to see its usage format.
      </p>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for a function…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 text-lg border rounded shadow-sm focus:ring focus:outline-none text-black font-sans"
        />
      </div>

      {/* Function Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((fn) => (
          <FormulaCard key={fn} name={fn} />
        ))}
      </div>
    </div>
  );
}

function FormulaCard({ name }) {
  const sampleUsage = getExampleUsage(name);

  return (
    <div className="p-5 bg-white shadow rounded-lg border hover:shadow-md transition">
      <h2 className="text-xl font-bold text-blue-600 mb-2">{name}</h2>

      <p className="text-gray-700 text-sm mb-2">
        Example:
      </p>

      <code className="block bg-gray-100 p-2 rounded text-sm text-gray-800 mb-3">
        {sampleUsage}
      </code>

      <p className="text-gray-600 text-sm">
        This function is provided by <strong>formulajs</strong>. For full
        documentation, check the project's GitHub.
      </p>
    </div>
  );
}

/**
 * Generates a readable example usage depending on the function name.
 * This makes the UI feel smart & useful.
 */
function getExampleUsage(fn) {
  const upper = fn.toUpperCase();

  if (upper === "SUM") return "=SUM(A1:A5)";
  if (upper === "AVERAGE") return "=AVERAGE(B1:B10)";
  if (upper === "MIN") return "=MIN(C1:C10)";
  if (upper === "MAX") return "=MAX(C1:C10)";
  if (upper === "COUNT") return "=COUNT(A1:A20)";
  if (upper === "IF") return '=IF(A1>10, "YES", "NO")';
  if (upper === "ROUND") return "=ROUND(A1, 2)";
  if (upper === "ABS") return "=ABS(A1)";
  if (upper === "SQRT") return "=SQRT(B3)";
  if (upper === "RAND") return "=RAND()";
  if (upper === "RANDBETWEEN") return "=RANDBETWEEN(1, 100)";
  if (upper === "CONCAT") return '=CONCAT("Hello ", "World")';
  if (upper === "TEXT") return '=TEXT(A1, "0.00")';

  // fallback generic example
  return `=${upper}(value1, value2)`;
}
