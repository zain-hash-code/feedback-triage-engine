"use client";

import React from "react";
import { TenantUsageSummary } from "@/lib/types";
import { AlertCircle, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

interface TenantMeterProps {
  usage: TenantUsageSummary | null;
  loading: boolean;
  onResetUsage?: () => void;
}

export const TenantMeter: React.FC<TenantMeterProps> = ({
  usage,
  loading,
  onResetUsage,
}) => {
  if (loading || !usage) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
        <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      </div>
    );
  }

  const { monthly_token_budget, tokens_used, percentage_used, status } = usage;
  const clampedPercentage = Math.min(percentage_used, 100);

  // Determine meter styling based on status threshold
  let progressColor = "bg-blue-600";
  let alertBadge = null;

  if (status === "exceeded_100") {
    progressColor = "bg-rose-600";
    alertBadge = (
      <div
        data-testid="quota-exceeded-badge"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Quota Exceeded (100%)</span>
      </div>
    );
  } else if (status === "warning_80") {
    progressColor = "bg-amber-500";
    alertBadge = (
      <div
        data-testid="quota-warning-badge"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Warning: 80% Threshold Reached</span>
      </div>
    );
  } else {
    alertBadge = (
      <div
        data-testid="quota-normal-badge"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Healthy Allocation</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tenant AI Token Usage
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {tokens_used.toLocaleString()}{" "}
            <span className="text-sm font-normal text-slate-500">
              / {monthly_token_budget.toLocaleString()} tokens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {alertBadge}
          {onResetUsage && (
            <button
              onClick={onResetUsage}
              title="Reset tenant tokens (for evaluation & testing)"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          data-testid="token-meter-bar"
          className={`h-full transition-all duration-500 ease-out ${progressColor}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
        <span>{percentage_used}% monthly capacity utilized</span>
        <span>
          {Math.max(0, monthly_token_budget - tokens_used).toLocaleString()} tokens remaining
        </span>
      </div>
    </div>
  );
};
