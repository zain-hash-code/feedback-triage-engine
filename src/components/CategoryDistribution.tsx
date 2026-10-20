"use client";

import React from "react";
import { AnalyticsSummary } from "@/lib/types";
import { Sparkles, Zap, Layers } from "lucide-react";

interface CategoryDistributionProps {
  analytics: AnalyticsSummary | null;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  analytics,
  activeCategory,
  onSelectCategory,
}) => {
  if (!analytics) return null;

  const { bug, feature_request, billing, other } = analytics.category_breakdown;
  const total = bug + feature_request + billing + other || 1;

  const bugPct = Math.round((bug / total) * 100);
  const featurePct = Math.round((feature_request / total) * 100);
  const billingPct = Math.round((billing / total) * 100);
  const otherPct = Math.max(0, 100 - (bugPct + featurePct + billingPct));

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            AI Triage Category Distribution
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            ({total} analyzed)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Avg Latency: {analytics.average_latency_ms}ms
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Claude 3.5 Haiku
          </span>
        </div>
      </div>

      {/* Multi-segment Category Bar */}
      <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-zinc-800 mb-3">
        <div
          title={`Bugs: ${bug} (${bugPct}%)`}
          className="bg-red-500 transition-all hover:opacity-90 cursor-pointer"
          style={{ width: `${(bug / total) * 100}%` }}
          onClick={() => onSelectCategory(activeCategory === "bug" ? "" : "bug")}
        />
        <div
          title={`Feature Requests: ${feature_request} (${featurePct}%)`}
          className="bg-purple-500 transition-all hover:opacity-90 cursor-pointer"
          style={{ width: `${(feature_request / total) * 100}%` }}
          onClick={() => onSelectCategory(activeCategory === "feature_request" ? "" : "feature_request")}
        />
        <div
          title={`Billing: ${billing} (${billingPct}%)`}
          className="bg-amber-500 transition-all hover:opacity-90 cursor-pointer"
          style={{ width: `${(billing / total) * 100}%` }}
          onClick={() => onSelectCategory(activeCategory === "billing" ? "" : "billing")}
        />
        <div
          title={`Other: ${other} (${otherPct}%)`}
          className="bg-zinc-500 transition-all hover:opacity-90 cursor-pointer"
          style={{ width: `${(other / total) * 100}%` }}
          onClick={() => onSelectCategory(activeCategory === "other" ? "" : "other")}
        />
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelectCategory(activeCategory === "bug" ? "" : "bug")}
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all ${
            activeCategory === "bug"
              ? "bg-red-950 text-red-300 border-red-700"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Bugs ({bug})</span>
          <span className="font-mono text-[10px] text-zinc-400">{bugPct}%</span>
        </button>

        <button
          onClick={() =>
            onSelectCategory(activeCategory === "feature_request" ? "" : "feature_request")
          }
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all ${
            activeCategory === "feature_request"
              ? "bg-purple-950 text-purple-300 border-purple-700"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Features ({feature_request})</span>
          <span className="font-mono text-[10px] text-zinc-400">{featurePct}%</span>
        </button>

        <button
          onClick={() => onSelectCategory(activeCategory === "billing" ? "" : "billing")}
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all ${
            activeCategory === "billing"
              ? "bg-amber-950 text-amber-300 border-amber-700"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Billing ({billing})</span>
          <span className="font-mono text-[10px] text-zinc-400">{billingPct}%</span>
        </button>

        <button
          onClick={() => onSelectCategory(activeCategory === "other" ? "" : "other")}
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all ${
            activeCategory === "other"
              ? "bg-zinc-800 text-zinc-200 border-zinc-600"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          <span>General ({other})</span>
          <span className="font-mono text-[10px] text-zinc-400">{otherPct}%</span>
        </button>

        {activeCategory && (
          <button
            onClick={() => onSelectCategory("")}
            className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline ml-auto"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );
};
