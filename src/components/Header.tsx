"use client";

import React from "react";
import { Search, Plus, Download, Bell, Sparkles } from "lucide-react";

interface HeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  onOpenIngestModal: () => void;
  onExportCsv: () => void;
  urgentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  search,
  onSearchChange,
  onOpenIngestModal,
  onExportCsv,
  urgentCount,
}) => {
  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tickets, summaries, or engineering assignees... (⌘K)"
            className="w-full text-xs bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 rounded-lg pl-9 pr-12 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-2.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/70 border border-zinc-700/60 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-3">
        {/* CSV Export */}
        <button
          onClick={onExportCsv}
          title="Export filtered records to CSV"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export CSV</span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={onOpenIngestModal}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingest Feedback</span>
          <span className="hidden md:inline-flex text-[10px] bg-blue-700/60 px-1 rounded font-mono">
            ⌘N
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {urgentCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-950" />
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-zinc-700">
            AI
          </div>
        </div>
      </div>
    </header>
  );
};
