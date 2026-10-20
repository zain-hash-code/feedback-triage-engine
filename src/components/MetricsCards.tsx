"use client";

import React from "react";
import {
  MessageSquare,
  AlertTriangle,
  Coins,
  TrendingUp,
  Smile,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { TenantUsageSummary, AnalyticsSummary } from "@/lib/types";

interface MetricsCardsProps {
  usage: TenantUsageSummary | null;
  analytics: AnalyticsSummary | null;
  loading: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  usage,
  analytics,
  loading,
}) => {
  if (loading || !usage) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  const total = analytics?.total_feedback ?? 0;
  const urgent = analytics?.urgent_count ?? 0;
  const positive = analytics?.sentiment_breakdown.positive ?? 0;
  const negative = analytics?.sentiment_breakdown.negative ?? 0;
  const neutral = analytics?.sentiment_breakdown.neutral ?? 0;
  const sentimentTotal = positive + negative + neutral || 1;
  const positivePercent = Math.round((positive / sentimentTotal) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Volume */}
      <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            Ingested Customer Voice
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
            <TrendingUp className="w-3 h-3" />
            +18.4%
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono mt-1">
          {total.toLocaleString()}
          <span className="text-xs font-normal text-zinc-500 ml-1.5 font-sans">
            tickets
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
          <span>{analytics?.open_count ?? 0} active in triage</span>
          <span className="text-zinc-400">{analytics?.average_latency_ms ?? 240}ms avg</span>
        </div>
      </div>

      {/* 2. Urgent & Critical Incidents */}
      <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Critical SLA Queue
          </span>
          {urgent > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/70 border border-rose-800/60 px-1.5 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Action Req.
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-white font-mono mt-1">
          {urgent}
          <span className="text-xs font-normal text-zinc-500 ml-1.5 font-sans">
            unresolved
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
          <span>Target SLA: &lt; 2.0 hours</span>
          <span className="text-emerald-400 font-medium">99.4% compliance</span>
        </div>
      </div>

      {/* 3. AI Token Meter & Dollar Spend */}
      <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            AI Token Spend &amp; Quota
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              usage.status === "exceeded_100"
                ? "bg-rose-950 text-rose-300 border-rose-800"
                : usage.status === "warning_80"
                ? "bg-amber-950 text-amber-300 border-amber-800"
                : "bg-emerald-950 text-emerald-300 border-emerald-800"
            }`}
          >
            {usage.percentage_used}%
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono mt-1">
          ${usage.estimated_cost_usd.toFixed(3)}
          <span className="text-xs font-normal text-zinc-500 ml-1.5 font-sans">
            / ${( (usage.monthly_token_budget / 1_000_000) * 3.0 ).toFixed(2)} cap
          </span>
        </div>
        <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              usage.status === "exceeded_100"
                ? "bg-rose-500"
                : usage.status === "warning_80"
                ? "bg-amber-400"
                : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Customer Sentiment Health Index */}
      <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-emerald-400" />
            Sentiment Health Index
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            {positivePercent}% Positive
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono mt-1">
          {Math.round((positive / sentimentTotal) * 100)}
          <span className="text-xs font-normal text-zinc-500 ml-1 font-sans">
            / 100 Score
          </span>
        </div>
        {/* Multi-segment bar */}
        <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="bg-emerald-400"
            style={{ width: `${(positive / sentimentTotal) * 100}%` }}
          />
          <div
            className="bg-zinc-500"
            style={{ width: `${(neutral / sentimentTotal) * 100}%` }}
          />
          <div
            className="bg-rose-500"
            style={{ width: `${(negative / sentimentTotal) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
