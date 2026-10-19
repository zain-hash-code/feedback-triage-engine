import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  switch (urgency) {
    case "critical":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Critical
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Low
        </span>
      );
  }
};

export const SentimentTag: React.FC<{ sentiment: string }> = ({ sentiment }) => {
  switch (sentiment) {
    case "positive":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Positive
        </span>
      );
    case "negative":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Negative
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          Neutral
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, { label: string; style: string }> = {
    bug: { label: "Bug", style: "bg-red-50 text-red-700 border-red-200" },
    feature_request: { label: "Feature", style: "bg-purple-50 text-purple-700 border-purple-200" },
    billing: { label: "Billing", style: "bg-amber-50 text-amber-700 border-amber-200" },
    other: { label: "Other", style: "bg-slate-50 text-slate-700 border-slate-200" },
  };

  const item = map[category] || { label: category, style: "bg-slate-50 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "processed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle className="w-3.5 h-3.5" />
          Processed
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
};
