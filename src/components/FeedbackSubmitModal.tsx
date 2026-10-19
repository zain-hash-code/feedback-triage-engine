"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle, Sparkles, Loader2 } from "lucide-react";

interface FeedbackSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSubmitted: () => void;
}

const TEMPLATES = [
  {
    label: "Critical Bug",
    source: "web",
    text: "The payment gateway is throwing a 500 internal server error on checkout when customers use American Express cards in production!",
  },
  {
    label: "Billing Issue",
    source: "email",
    text: "Hi support, our subscription account was billed twice this morning for the Enterprise annual plan ($12,000). Please refund the duplicate invoice immediately.",
  },
  {
    label: "Feature Request",
    source: "web",
    text: "We really need an audit log export to AWS S3 or Datadog for compliance reporting. This would save our security team hours each week.",
  },
  {
    label: "Customer Praise",
    source: "api",
    text: "Just wanted to say the new dashboard v2 interface is incredibly fast and intuitive. Our entire engineering team loves it!",
  },
];

export const FeedbackSubmitModal: React.FC<FeedbackSubmitModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  onSubmitted,
}) => {
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("web");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setErrorMsg(
            `Quota Exceeded: This tenant has exhausted their monthly token budget (${data.used}/${data.budget}). Feedback cannot be processed.`
          );
        } else {
          setErrorMsg(data.message || "Failed to submit feedback");
        }
        return;
      }

      setRawText("");
      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error submitting feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setRawText(tpl.text);
    setSource(tpl.source);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ingest Customer Feedback
              </h2>
              <p className="text-xs text-slate-500">
                Tenant ID: <span className="font-mono text-slate-700">{tenantId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Test Templates */}
        <div className="my-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Test Templates
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors font-medium"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback Channel / Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="web">Web In-App Widget</option>
              <option value="email">Email Support Ticket</option>
              <option value="api">External API Webhook</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Raw Customer Feedback Text
            </label>
            <textarea
              required
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste unstructured customer complaint, bug report, or feature suggestion..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !rawText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send for Triage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
