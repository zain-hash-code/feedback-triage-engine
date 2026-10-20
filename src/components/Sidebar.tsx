"use client";

import React from "react";
import {
  Layers,
  AlertTriangle,
  BarChart3,
  Webhook,
  Activity,
  Building2,
  ChevronDown,
  Coins,
  Cpu,
  RotateCcw,
} from "lucide-react";
import { TenantUsageSummary } from "@/lib/types";

interface SidebarProps {
  tenants: Array<{ id: string; name: string }>;
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
  usage: TenantUsageSummary | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  urgentCount: number;
  totalCount: number;
  onResetUsage: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tenants,
  selectedTenantId,
  onSelectTenant,
  usage,
  activeTab,
  onSelectTab,
  urgentCount,
  totalCount,
  onResetUsage,
}) => {
  const currentTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 text-zinc-300">
      {/* Top Workspace & Branding */}
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                Pulse Triage
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block">
                Enterprise AI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        {/* Workspace Organization Switcher */}
        <div className="p-3 border-b border-zinc-800/80">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2 block mb-1">
            Current Workspace
          </label>
          <div className="relative">
            <select
              value={selectedTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="w-full appearance-none bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/70 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-8 cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {usage && (
            <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-zinc-400 font-medium">{usage.plan_tier || "Enterprise"}</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {usage.tokens_remaining.toLocaleString()} left
              </span>
            </div>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => onSelectTab("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Feedback Stream</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab("urgent")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "urgent"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Urgent SLA Issues</span>
            </div>
            {urgentCount > 0 && (
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab("analytics")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-purple-600/15 text-purple-400 border border-purple-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics &amp; Spend</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("webhooks")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "webhooks"
                ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4" />
              <span>Webhook Simulator</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-emerald-400">API</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer: Real-time Token Ledger & Operational SLA */}
      <div className="p-3 border-t border-zinc-800/80 space-y-3 bg-zinc-950/80">
        {usage && (
          <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                Monthly Token Quota
              </span>
              <button
                onClick={onResetUsage}
                title="Reset quota (test administrative trigger)"
                className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden my-1.5">
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

            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>{usage.percentage_used}% used</span>
              <span>${usage.estimated_cost_usd.toFixed(3)} est.</span>
            </div>
          </div>
        )}

        {/* Operational Status */}
        <div className="px-1 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>LLM Cluster 99.98%</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
