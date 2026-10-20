"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MetricsCards } from "@/components/MetricsCards";
import { CategoryDistribution } from "@/components/CategoryDistribution";
import { FeedbackTable, FeedbackWithAnalysis } from "@/components/FeedbackTable";
import { FeedbackDetailDrawer } from "@/components/FeedbackDetailDrawer";
import { IngestModal } from "@/components/IngestModal";
import { BatchActionBar } from "@/components/BatchActionBar";
import { TenantUsageSummary, AnalyticsSummary } from "@/lib/types";
import {
  Filter,
  RefreshCw,
  Plus,
  Layers,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("tenant-acme");
  const [usage, setUsage] = useState<TenantUsageSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackWithAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<string>("all"); // "all", "urgent", "analytics", "webhooks"
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [resolutionFilter, setResolutionFilter] = useState<string>("");

  // Modals & Drawers
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [inspectedItem, setInspectedItem] = useState<FeedbackWithAnalysis | null>(null);

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Fetch Tenants
  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await fetch("/api/v1/tenants");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setTenants(json.data);
          if (!json.data.some((t: any) => t.id === activeTenantId)) {
            setActiveTenantId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load tenants:", err);
      }
    }
    fetchTenants();
  }, []);

  // 2. Fetch Usage
  const loadUsage = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      const res = await fetch(`/api/v1/tenants/${activeTenantId}/usage`);
      const json = await res.json();
      if (json.success) setUsage(json.data);
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  }, [activeTenantId]);

  // 3. Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      const res = await fetch("/api/v1/analytics", {
        headers: { "x-tenant-id": activeTenantId },
      });
      const json = await res.json();
      if (json.success) setAnalytics(json.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  }, [activeTenantId]);

  // 4. Fetch Feedback Stream
  const loadFeedback = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (urgencyFilter) params.set("urgency", urgencyFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (resolutionFilter) params.set("resolution_status", resolutionFilter);

      const res = await fetch(`/api/v1/feedback?${params.toString()}`, {
        headers: { "x-tenant-id": activeTenantId },
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(json.data);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  }, [
    activeTenantId,
    search,
    categoryFilter,
    urgencyFilter,
    sourceFilter,
    resolutionFilter,
  ]);

  const refreshAll = useCallback(() => {
    loadUsage();
    loadAnalytics();
    loadFeedback();
  }, [loadUsage, loadAnalytics, loadFeedback]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-polling when background jobs are processing
  useEffect(() => {
    const hasPending = feedback.some((f) => f.status === "pending");
    if (!hasPending) return;

    const timer = setInterval(() => {
      loadFeedback();
      loadUsage();
      loadAnalytics();
    }, 2000);

    return () => clearInterval(timer);
  }, [feedback, loadFeedback, loadUsage, loadAnalytics]);

  // Reset Quota trigger
  const handleResetUsage = async () => {
    if (!activeTenantId) return;
    try {
      await fetch(`/api/v1/tenants/${activeTenantId}/reset`, { method: "POST" });
      loadUsage();
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcut ⌘K and ⌘N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setIsIngestModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items based on activeTab
  const displayedEntries = useMemo(() => {
    if (activeTab === "urgent") {
      return feedback.filter(
        (f) =>
          f.analysis?.urgency === "critical" || f.analysis?.urgency === "high"
      );
    }
    return feedback;
  }, [feedback, activeTab]);

  // Batch actions
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    setSelectedIds(selectAll ? displayedEntries.map((e) => e.id) : []);
  };

  const handleBatchStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      await fetch("/api/v1/feedback/batch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": activeTenantId,
        },
        body: JSON.stringify({
          ids: selectedIds,
          action: { resolution_status: status },
        }),
      });
      setSelectedIds([]);
      refreshAll();
    } catch (err) {
      console.error("Batch update failed:", err);
    }
  };

  // CSV Export
  const handleExportCsv = (idsToExport?: string[]) => {
    const exportData = idsToExport
      ? feedback.filter((f) => idsToExport.includes(f.id))
      : feedback;

    if (exportData.length === 0) return;

    const headers = [
      "ID",
      "Date",
      "Source",
      "Raw_Text",
      "Category",
      "Urgency",
      "Sentiment",
      "Resolution_Status",
      "Assigned_To",
      "Tokens_Consumed",
      "Summary",
    ];

    const rows = exportData.map((f) => [
      `"${f.id}"`,
      `"${f.created_at}"`,
      `"${f.source}"`,
      `"${f.raw_text.replace(/"/g, '""')}"`,
      `"${f.analysis?.category || ""}"`,
      `"${f.analysis?.urgency || ""}"`,
      `"${f.analysis?.sentiment || ""}"`,
      `"${f.resolution_status || "open"}"`,
      `"${f.assigned_to || ""}"`,
      `"${f.analysis?.tokens_consumed || 0}"`,
      `"${(f.analysis?.summary || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `feedback-triage-${activeTenantId}-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const urgentCount = analytics?.urgent_count ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sleek Enterprise Sidebar */}
      <Sidebar
        tenants={tenants}
        selectedTenantId={activeTenantId}
        onSelectTenant={(id) => {
          setActiveTenantId(id);
          setSelectedIds([]);
        }}
        usage={usage}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === "webhooks") {
            setIsIngestModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        urgentCount={urgentCount}
        totalCount={analytics?.total_feedback ?? feedback.length}
        onResetUsage={handleResetUsage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          search={search}
          onSearchChange={setSearch}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          onExportCsv={() => handleExportCsv()}
          urgentCount={urgentCount}
        />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Executive KPI Metrics */}
          <section>
            <MetricsCards
              usage={usage}
              analytics={analytics}
              loading={loading && !usage}
            />
          </section>

          {/* Category Distribution Bar */}
          <section>
            <CategoryDistribution
              analytics={analytics}
              activeCategory={categoryFilter}
              onSelectCategory={(cat) => setCategoryFilter(cat)}
            />
          </section>

          {/* Feedback Stream Controls & Filter Bar */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All Feedback
                </button>
                <button
                  onClick={() => setActiveTab("urgent")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "urgent"
                      ? "bg-rose-950 text-rose-300 border border-rose-800/80 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Urgent Incidents ({urgentCount})
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2">
                {/* Channel Filter */}
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Channels</option>
                  <option value="zendesk">Zendesk</option>
                  <option value="intercom">Intercom</option>
                  <option value="stripe">Stripe</option>
                  <option value="web">In-App Voice</option>
                  <option value="email">Email</option>
                  <option value="api">API Webhook</option>
                </select>

                {/* Resolution Status Filter */}
                <select
                  value={resolutionFilter}
                  onChange={(e) => setResolutionFilter(e.target.value)}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <button
                  onClick={refreshAll}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="Refresh stream"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <FeedbackTable
              entries={displayedEntries}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={(item) => setInspectedItem(item)}
            />
          </section>
        </main>
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        onMarkResolved={() => handleBatchStatus("resolved")}
        onMarkInProgress={() => handleBatchStatus("in_progress")}
        onExportSelected={() => handleExportCsv(selectedIds)}
        onClear={() => setSelectedIds([])}
      />

      {/* Slide-over Inspection Drawer */}
      <FeedbackDetailDrawer
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        tenantId={activeTenantId}
        onUpdated={() => {
          refreshAll();
          if (inspectedItem) {
            // refresh single inspected item
            fetch(`/api/v1/feedback/${inspectedItem.id}`, {
              headers: { "x-tenant-id": activeTenantId },
            })
              .then((r) => r.json())
              .then((res) => {
                if (res.success) setInspectedItem(res.data);
              })
              .catch(() => {});
          }
        }}
      />

      {/* Dual-tab Ingestion & Webhook Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        tenantId={activeTenantId}
        onSubmitted={refreshAll}
      />
    </div>
  );
}
