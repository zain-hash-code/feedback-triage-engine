"use client";

import React from "react";
import { Search, Filter, RefreshCw, PlusCircle, Building2 } from "lucide-react";

interface FilterBarProps {
  category: string;
  onCategoryChange: (val: string) => void;
  urgency: string;
  onUrgencyChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onRefresh: () => void;
  onOpenSubmitModal: () => void;
  loading: boolean;
  tenants: Array<{ id: string; name: string }>;
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  category,
  onCategoryChange,
  urgency,
  onUrgencyChange,
  search,
  onSearchChange,
  onRefresh,
  onOpenSubmitModal,
  loading,
  tenants,
  selectedTenantId,
  onSelectTenant,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Top Row: Tenant Switcher & Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Tenant:
          </span>
          <select
            value={selectedTenantId}
            onChange={(e) => onSelectTenant(e.target.value)}
            className="text-sm font-semibold bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Feedback List"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Ingest Feedback
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search feedback text..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="bug">Bugs</option>
            <option value="feature_request">Feature Requests</option>
            <option value="billing">Billing Issues</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Urgency Filter */}
        <div className="flex items-center gap-2">
          <select
            value={urgency}
            onChange={(e) => onUrgencyChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};
