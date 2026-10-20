"use client";

import React from "react";
import { CheckCircle2, Clock, Download, X } from "lucide-react";

interface BatchActionBarProps {
  selectedCount: number;
  onMarkResolved: () => void;
  onMarkInProgress: () => void;
  onExportSelected: () => void;
  onClear: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onMarkResolved,
  onMarkInProgress,
  onExportSelected,
  onClear,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 border border-zinc-700/80 text-white rounded-full px-5 py-2.5 shadow-2xl shadow-black/80 flex items-center gap-4 animate-slide-up">
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-750">
        <span className="w-5 h-5 rounded-full bg-blue-600 text-[11px] font-bold flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-zinc-300">Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onMarkResolved}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-800/80 px-3 py-1.5 rounded-full transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark Resolved
        </button>

        <button
          onClick={onMarkInProgress}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-950 border border-blue-800/80 px-3 py-1.5 rounded-full transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          In Progress
        </button>

        <button
          onClick={onExportSelected}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <button
        onClick={onClear}
        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
