"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Zap,
  Coins,
  Send,
  CheckCircle2,
  Share2,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  SourceBadge,
  UrgencyBadge,
  SentimentTag,
  CategoryBadge,
  ResolutionBadge,
} from "./Badges";
import { FeedbackWithAnalysis } from "./FeedbackTable";

interface FeedbackDetailDrawerProps {
  item: FeedbackWithAnalysis | null;
  onClose: () => void;
  tenantId: string;
  onUpdated: () => void;
}

export const FeedbackDetailDrawer: React.FC<FeedbackDetailDrawerProps> = ({
  item,
  onClose,
  tenantId,
  onUpdated,
}) => {
  const [resolutionStatus, setResolutionStatus] = useState<string>("open");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [syncedLinear, setSyncedLinear] = useState<boolean>(false);
  const [syncedSlack, setSyncedSlack] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setResolutionStatus(item.resolution_status || "open");
      setAssignedTo(item.assigned_to || "Unassigned");
      setInternalNotes(item.internal_notes || "");
      setSyncedLinear(false);
      setSyncedSlack(false);
    }
  }, [item]);

  if (!item) return null;

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      await fetch(`/api/v1/feedback/${item.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          resolution_status: resolutionStatus,
          assigned_to: assignedTo,
          internal_notes: internalNotes,
        }),
      });
      onUpdated();
    } catch (err) {
      console.error("Failed to update feedback entry:", err);
    } finally {
      setSaving(false);
    }
  };

  const costEst = item.analysis?.tokens_consumed
    ? ((item.analysis.tokens_consumed / 1_000_000) * 3.0).toFixed(5)
    : "0.00030";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 h-full flex flex-col justify-between shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400">
                Ticket #{item.id.slice(-8).toUpperCase()}
              </span>
              <SourceBadge source={item.source} />
              <ResolutionBadge status={resolutionStatus} />
            </div>
            <div className="text-xs text-zinc-400">
              Ingested on {new Date(item.created_at).toLocaleString()}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Customer Voice Section */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Raw Customer Payload
            </label>
            <div className="p-4 bg-zinc-900/90 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 leading-relaxed font-sans select-text">
              &ldquo;{item.raw_text}&rdquo;
            </div>
          </div>

          {/* AI Intelligence Card */}
          {item.analysis ? (
            <div className="p-5 bg-gradient-to-b from-blue-950/40 to-indigo-950/20 border border-blue-900/50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Autonomous AI Triage Assessment</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  {Math.round((item.analysis.confidence_score || 0.94) * 100)}% Confidence
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={item.analysis.category} />
                <UrgencyBadge urgency={item.analysis.urgency} />
                <SentimentTag sentiment={item.analysis.sentiment} />
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-blue-300">
                  Executive Issue Summary:
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {item.analysis.summary}
                </p>
              </div>

              {/* Suggested Operational Action */}
              <div className="p-3 bg-zinc-900/90 border border-blue-900/40 rounded-lg space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Suggested Operational Next Step
                </div>
                <p className="text-xs text-zinc-300">
                  {item.analysis.suggested_action ||
                    "Review and forward to the corresponding domain engineering lead"}
                </p>
              </div>

              {/* Telemetry Footprint */}
              <div className="pt-2 border-t border-blue-900/40 grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400">
                <div>
                  <span className="block text-zinc-400 text-[10px]">Latency</span>
                  <span className="text-zinc-200 font-semibold">
                    {item.analysis.latency_ms || 240} ms
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-400 text-[10px]">Tokens Billed</span>
                  <span className="text-zinc-200 font-semibold">
                    {item.analysis.tokens_consumed} tokens
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-400 text-[10px]">Query Cost</span>
                  <span className="text-zinc-200 font-semibold">${costEst}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 animate-pulse">
              AI analysis is in progress...
            </div>
          )}

          {/* Workflow & Assignment Controls */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Workflow Management
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Resolution Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-750 rounded-lg p-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Assigned Team
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-750 rounded-lg p-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Core Platform Engineering">Platform Engineering</option>
                  <option value="Billing & Revenue Ops">Billing &amp; Revenue Ops</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Customer Success">Customer Success</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Internal Engineering Notes
              </label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal debugging context, customer communication logs, or PR references..."
                className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Integration Dispatch Simulators */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
              1-Click Integrations
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSyncedLinear(true)}
                disabled={syncedLinear}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all ${
                  syncedLinear
                    ? "bg-purple-950/60 text-purple-300 border-purple-800"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                {syncedLinear ? "Synced: #ENG-489" : "Sync to Linear"}
              </button>

              <button
                type="button"
                onClick={() => setSyncedSlack(true)}
                disabled={syncedSlack}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all ${
                  syncedSlack
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                {syncedSlack ? "Posted to #incidents" : "Alert Slack"}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 sticky bottom-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white px-3 py-2"
          >
            Close Drawer
          </button>
          <button
            onClick={handleSaveWorkflow}
            disabled={saving}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Update Ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
