"use client";

import React from "react";
import {
  UrgencyBadge,
  SentimentTag,
  CategoryBadge,
  StatusBadge,
  SourceBadge,
  ResolutionBadge,
} from "./Badges";
import { Sparkles, MessageSquare, ArrowUpRight, User } from "lucide-react";

export interface FeedbackWithAnalysis {
  id: string;
  tenant_id: string;
  raw_text: string;
  source: string;
  status: string;
  resolution_status?: string;
  assigned_to?: string | null;
  internal_notes?: string | null;
  created_at: string;
  analysis?: {
    id: string;
    category: string;
    urgency: string;
    summary: string;
    sentiment: string;
    suggested_action?: string;
    confidence_score?: number;
    latency_ms?: number;
    tokens_consumed: number;
    created_at: string;
  } | null;
}

interface FeedbackTableProps {
  entries: FeedbackWithAnalysis[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (all: boolean) => void;
  onRowClick: (item: FeedbackWithAnalysis) => void;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  entries,
  loading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onRowClick,
}) => {
  const allSelected = entries.length > 0 && selectedIds.length === entries.length;

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center justify-between py-3.5 border-b border-zinc-800/80 last:border-none"
          >
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
              <div className="h-3 bg-zinc-800/60 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-zinc-800 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-16 text-center shadow-sm">
        <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-zinc-200">
          No Feedback Entries Match Filters
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          Try clearing your search query or switching tabs. New incoming webhooks will appear here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table on desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Channel &amp; Voice</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Resolution</th>
              <th className="py-3 px-4">Team Assignee</th>
              <th className="py-3 px-4 text-right">Tokens</th>
              <th className="py-3 px-4 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs">
            {entries.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  onClick={() => onRowClick(item)}
                  className={`hover:bg-zinc-800/40 transition-colors cursor-pointer group ${
                    isSelected ? "bg-blue-950/20" : ""
                  }`}
                >
                  <td
                    className="py-3.5 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      className="rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </td>

                  {/* Channel & Raw Voice */}
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <SourceBadge source={item.source} />
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-200 line-clamp-1 font-normal group-hover:text-white transition-colors">
                      {item.raw_text}
                    </p>
                    {item.analysis?.summary && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-medium">
                        ✦ {item.analysis.summary}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.analysis ? (
                      <CategoryBadge category={item.analysis.category} />
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </td>

                  {/* Urgency */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.analysis ? (
                      <UrgencyBadge urgency={item.analysis.urgency} />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Sentiment */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.analysis ? (
                      <SentimentTag sentiment={item.analysis.sentiment} />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Resolution Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ResolutionBadge status={item.resolution_status || "open"} />
                  </td>

                  {/* Assigned Team */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 font-medium text-[11px]">
                    {item.assigned_to ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-500" />
                        {item.assigned_to}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Tokens */}
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-zinc-400">
                    {item.analysis?.tokens_consumed ? (
                      <span className="text-zinc-300 font-semibold">
                        {item.analysis.tokens_consumed}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Action link */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Inspect Triage Breakdown"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-zinc-800">
        {entries.map((item) => (
          <div
            key={item.id}
            onClick={() => onRowClick(item)}
            className="p-4 space-y-3 hover:bg-zinc-800/40 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SourceBadge source={item.source} />
                <ResolutionBadge status={item.resolution_status || "open"} />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-zinc-200 line-clamp-2">{item.raw_text}</p>

            {item.analysis && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <CategoryBadge category={item.analysis.category} />
                <UrgencyBadge urgency={item.analysis.urgency} />
                <SentimentTag sentiment={item.analysis.sentiment} />
                <span className="text-[11px] font-mono text-zinc-400 ml-auto">
                  {item.analysis.tokens_consumed} tokens
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
