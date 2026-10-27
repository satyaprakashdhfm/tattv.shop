"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="no-print btn btn-dark btn-sm mb-6">
      Print
    </button>
  );
}
