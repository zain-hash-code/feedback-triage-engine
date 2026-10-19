"use client";

import React, { useState } from "react";
import { UrgencyBadge, SentimentTag, CategoryBadge, StatusBadge } from "./Badges";
import { Sparkles, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export interface FeedbackWithAnalysis {
  id: string;
  tenant_id: string;
  raw_text: string;
  source: string;
  status: string;
  created_at: string;
  analysis?: {
    id: string;
    category: string;
    urgency: string;
    summary: string;
    sentiment: string;
    tokens_consumed: number;
    created_at: string;
  } | null;
}

interface FeedbackTableProps {
  entries: FeedbackWithAnalysis[];
  loading: boolean;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  entries,
  loading,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-none">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Feedback Entries Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No feedback entries match your current filter, or this tenant hasn&apos;t ingested any customer feedback yet.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Feedback / User Voice</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Tokens</th>
              <th className="py-3 px-4 text-center">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entries.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-md font-normal text-slate-800">
                      <p className="line-clamp-2">{item.raw_text}</p>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs uppercase font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.analysis ? (
                        <CategoryBadge category={item.analysis.category} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.analysis ? (
                        <UrgencyBadge urgency={item.analysis.urgency} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.analysis ? (
                        <SentimentTag sentiment={item.analysis.sentiment} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                      {item.analysis?.tokens_consumed ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {item.analysis.tokens_consumed}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.analysis ? (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          {isExpanded ? "Hide" : "View"}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expandable LLM Summary Drawer */}
                  {isExpanded && item.analysis && (
                    <tr className="bg-blue-50/40 border-b border-blue-100">
                      <td colSpan={8} className="p-4 pl-6 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                              LLM-Generated Triage Summary &amp; Insight
                            </div>
                            <p className="text-slate-700 leading-relaxed font-medium">
                              {item.analysis.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-200">
        {entries.map((item) => (
          <div key={item.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {item.source}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-slate-800">{item.raw_text}</p>
            {item.analysis && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <CategoryBadge category={item.analysis.category} />
                <UrgencyBadge urgency={item.analysis.urgency} />
                <SentimentTag sentiment={item.analysis.sentiment} />
                <span className="text-xs font-mono text-slate-500 ml-auto">
                  {item.analysis.tokens_consumed} tokens
                </span>
              </div>
            )}
            {item.analysis?.summary && (
              <div className="p-2.5 bg-blue-50 rounded text-xs text-slate-700 mt-2">
                <span className="font-semibold text-blue-800 block mb-0.5">Summary:</span>
                {item.analysis.summary}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
