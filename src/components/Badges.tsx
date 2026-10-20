import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Mail,
  Webhook,
  CreditCard,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

export const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const map: Record<
    string,
    { label: string; icon: React.ReactNode; style: string }
  > = {
    zendesk: {
      label: "Zendesk",
      icon: <HelpCircle className="w-3 h-3 text-emerald-400" />,
      style: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    },
    intercom: {
      label: "Intercom",
      icon: <MessageSquare className="w-3 h-3 text-blue-400" />,
      style: "bg-blue-950/60 text-blue-300 border-blue-800/60",
    },
    stripe: {
      label: "Stripe",
      icon: <CreditCard className="w-3 h-3 text-indigo-400" />,
      style: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60",
    },
    email: {
      label: "Email",
      icon: <Mail className="w-3 h-3 text-amber-400" />,
      style: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    },
    api: {
      label: "API Webhook",
      icon: <Webhook className="w-3 h-3 text-purple-400" />,
      style: "bg-purple-950/60 text-purple-300 border-purple-800/60",
    },
    web: {
      label: "In-App Voice",
      icon: <Globe className="w-3 h-3 text-sky-400" />,
      style: "bg-sky-950/60 text-sky-300 border-sky-800/60",
    },
  };

  const item = map[source.toLowerCase()] || {
    label: source,
    icon: <Globe className="w-3 h-3 text-zinc-400" />,
    style: "bg-zinc-800/70 text-zinc-300 border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${item.style}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  switch (urgency) {
    case "critical":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/70 shadow-sm shadow-rose-950/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          Critical SLA
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/70">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
          Low
        </span>
      );
  }
};

export const SentimentTag: React.FC<{ sentiment: string }> = ({ sentiment }) => {
  switch (sentiment) {
    case "positive":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Positive
        </span>
      );
    case "negative":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/50 text-rose-300 border border-rose-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Negative
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Neutral
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, { label: string; style: string }> = {
    bug: {
      label: "Bug Incident",
      style: "bg-red-950/60 text-red-300 border-red-800/60",
    },
    feature_request: {
      label: "Feature Request",
      style: "bg-purple-950/60 text-purple-300 border-purple-800/60",
    },
    billing: {
      label: "Billing & Invoicing",
      style: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    },
    other: {
      label: "General Feedback",
      style: "bg-zinc-800/60 text-zinc-300 border-zinc-700/60",
    },
  };

  const item = map[category] || {
    label: category,
    style: "bg-zinc-800/60 text-zinc-300 border-zinc-700/60",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${item.style}`}
    >
      {item.label}
    </span>
  );
};

export const ResolutionBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Resolved
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-950/70 text-blue-300 border border-blue-800/60">
          <Clock className="w-3 h-3 text-blue-400" />
          In Progress
        </span>
      );
    case "dismissed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
          <XCircle className="w-3 h-3 text-zinc-400" />
          Dismissed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          Open
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "processed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Triaged
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Processing
        </span>
      );
  }
};
