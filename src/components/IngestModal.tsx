"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  Sparkles,
  Webhook,
  MessageSquare,
  AlertCircle,
  Loader2,
  Code2,
} from "lucide-react";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSubmitted: () => void;
}

const WEBHOOK_PRESETS = [
  {
    name: "Stripe Payment Error",
    channel: "stripe",
    payload: {
      event: "charge.failed",
      source: "stripe",
      customer: "enterprise_sub_4920",
      raw_text:
        "Stripe charge failed: Card declined with code 500 issuer timeout on cardholder 3D Secure verification during renewal.",
    },
  },
  {
    name: "Zendesk High-Priority Bug",
    channel: "zendesk",
    payload: {
      event: "ticket.created",
      source: "zendesk",
      priority: "urgent",
      raw_text:
        "CSV report exports fail with an unhandled 504 gateway timeout when date range exceeds 90 days on Enterprise tier.",
    },
  },
  {
    name: "Intercom Customer Feature",
    channel: "intercom",
    payload: {
      event: "conversation.user.replied",
      source: "intercom",
      raw_text:
        "Would love native Datadog metrics forwarding for our API key usage logs. Our security auditing team needs this.",
    },
  },
];

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  onSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<"form" | "webhook">("form");
  const [source, setSource] = useState<string>("web");
  const [rawText, setRawText] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Webhook JSON State
  const [webhookJson, setWebhookJson] = useState<string>(
    JSON.stringify(WEBHOOK_PRESETS[0].payload, null, 2)
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          raw_text: rawText.trim(),
          source,
          ...(assignedTo ? { assigned_to: assignedTo } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setErrorMsg(
            `Token Quota Exhausted: This workspace has consumed all allocated monthly tokens (${data.used}/${data.budget}).`
          );
        } else {
          setErrorMsg(data.message || "Failed to ingest feedback.");
        }
        return;
      }

      setRawText("");
      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWebhook = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const parsed = JSON.parse(webhookJson);
      if (!parsed.raw_text) {
        throw new Error("Payload must contain a 'raw_text' property.");
      }

      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          raw_text: parsed.raw_text,
          source: parsed.source || "api",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setErrorMsg(
            `Token Quota Exhausted: ${data.message} (${data.used}/${data.budget})`
          );
        } else {
          setErrorMsg(data.message || "Webhook delivery failed.");
        }
        return;
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid JSON payload syntax.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-zinc-100 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Ingest Customer Feedback
              </h3>
              <p className="text-[11px] text-zinc-400">
                Workspace: <span className="font-mono text-zinc-300">{tenantId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "form"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Voice Form</span>
          </button>
          <button
            onClick={() => setActiveTab("webhook")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "webhook"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Live Webhook Simulator</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Form View */}
        {activeTab === "form" && (
          <form onSubmit={handleSubmitVoice} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Source Ingestion Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="web">In-App Voice Widget</option>
                  <option value="zendesk">Zendesk Support Ticket</option>
                  <option value="intercom">Intercom Conversation</option>
                  <option value="stripe">Stripe Dispute Webhook</option>
                  <option value="email">Support Inbound Email</option>
                  <option value="api">External REST API</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Target Domain Team (Optional)
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">AI Auto-Assign</option>
                  <option value="Core Platform Engineering">Platform Engineering</option>
                  <option value="Billing & Revenue Ops">Billing Ops</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Customer Success">Customer Success</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Customer Feedback / Incident Description
              </label>
              <textarea
                required
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste customer report, support ticket transcript, or user feedback..."
                className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-white px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !rawText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ingesting &amp; Debiting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch to Triage Queue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Webhook Simulator View */}
        {activeTab === "webhook" && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                Simulate Webhook Payloads
              </span>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      setWebhookJson(JSON.stringify(p.payload, null, 2))
                    }
                    className="text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                JSON Webhook Body
              </label>
              <textarea
                rows={7}
                value={webhookJson}
                onChange={(e) => setWebhookJson(e.target.value)}
                className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-white px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWebhook}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Simulating Delivery...</span>
                  </>
                ) : (
                  <>
                    <Webhook className="w-3.5 h-3.5" />
                    <span>Send Webhook Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
