import Link from "next/link";
import FormulaBar from "../../components/FormulaBar";
import Grid from "../../components/Grid/Grid";

export default function Page() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <h1 className="text-xl font-serif font-bold text-gray-700">Astrel</h1>

        {/* Link to the formulas page */}
        <Link
          href="/formulas"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          View All Formulas
        </Link>
      </div>

      {/* Formula bar */}
      <FormulaBar />

      {/* Grid */}
      <Grid />
    </div>
  );
}
