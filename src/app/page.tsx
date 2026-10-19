"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TenantMeter } from "@/components/TenantMeter";
import { FeedbackTable, FeedbackWithAnalysis } from "@/components/FeedbackTable";
import { FilterBar } from "@/components/FilterBar";
import { FeedbackSubmitModal } from "@/components/FeedbackSubmitModal";
import { TenantUsageSummary } from "@/lib/types";
import { Sparkles, Layers, ShieldCheck, Database, Cpu } from "lucide-react";

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("tenant-acme");
  const [usage, setUsage] = useState<TenantUsageSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackWithAnalysis[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(true);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true);

  // Filters
  const [category, setCategory] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Fetch Tenant List
  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await fetch("/api/v1/tenants");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setTenants(json.data);
          // Keep current active tenant if valid, otherwise pick first
          if (!json.data.some((t: any) => t.id === activeTenantId)) {
            setActiveTenantId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load tenants:", err);
      }
    }
    loadTenants();
  }, []);

  // 2. Fetch Usage for Active Tenant
  const loadUsage = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      setLoadingUsage(true);
      const res = await fetch(`/api/v1/tenants/${activeTenantId}/usage`);
      const json = await res.json();
      if (json.success) {
        setUsage(json.data);
      }
    } catch (err) {
      console.error("Failed to load usage:", err);
    } finally {
      setLoadingUsage(false);
    }
  }, [activeTenantId]);

  // 3. Fetch Feedback for Active Tenant
  const loadFeedback = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      setLoadingFeedback(true);
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (urgency) params.set("urgency", urgency);
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/feedback?${params.toString()}`, {
        headers: {
          "x-tenant-id": activeTenantId,
        },
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(json.data);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoadingFeedback(false);
    }
  }, [activeTenantId, category, urgency, search]);

  useEffect(() => {
    loadUsage();
    loadFeedback();
  }, [loadUsage, loadFeedback]);

  // Auto-poll if any feedback is in 'pending' state
  useEffect(() => {
    const hasPending = feedback.some((f) => f.status === "pending");
    if (!hasPending) return;

    const timer = setInterval(() => {
      loadFeedback();
      loadUsage();
    }, 2000);

    return () => clearInterval(timer);
  }, [feedback, loadFeedback, loadUsage]);

  const handleResetUsage = async () => {
    if (!activeTenantId) return;
    try {
      await fetch(`/api/v1/tenants/${activeTenantId}/reset`, {
        method: "POST",
      });
      loadUsage();
    } catch (err) {
      console.error("Failed to reset usage:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  Feedback Triage &amp; Metering Engine
                </h1>
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full font-mono">
                  FEAT-204
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI-Native Full-Stack System • Real-Time Token Budget &amp; Multitenancy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="hidden lg:flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Prompt &amp; XSS Secured
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Database className="w-4 h-4 text-blue-600" />
                ACID Isolation
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Cpu className="w-4 h-4 text-purple-600" />
                Zod Schema Validated
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Token Meter Section */}
        <section>
          <TenantMeter
            usage={usage}
            loading={loadingUsage}
            onResetUsage={handleResetUsage}
          />
        </section>

        {/* Toolbar & Filters */}
        <section>
          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            urgency={urgency}
            onUrgencyChange={setUrgency}
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => {
              loadFeedback();
              loadUsage();
            }}
            onOpenSubmitModal={() => setIsModalOpen(true)}
            loading={loadingFeedback}
            tenants={tenants}
            selectedTenantId={activeTenantId}
            onSelectTenant={(id) => {
              setActiveTenantId(id);
            }}
          />
        </section>

        {/* Feedback Table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800">
                Triage Pipeline Records
              </h2>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                {feedback.length}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Auto-refreshes when background triage tasks complete
            </span>
          </div>

          <FeedbackTable entries={feedback} loading={loadingFeedback} />
        </section>
      </main>

      {/* Ingestion Modal */}
      <FeedbackSubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={activeTenantId}
        onSubmitted={() => {
          loadFeedback();
          loadUsage();
        }}
      />
    </div>
  );
}
