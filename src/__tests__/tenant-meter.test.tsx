import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { TenantMeter } from "@/components/TenantMeter";
import { TenantUsageSummary } from "@/lib/types";

describe("TenantMeter Component Tests", () => {
  it("renders healthy allocation badge when usage is below 80%", () => {
    const normalUsage: TenantUsageSummary = {
      id: "t1",
      name: "Acme Corp",
      monthly_token_budget: 50000,
      tokens_used: 15000,
      tokens_remaining: 35000,
      percentage_used: 30,
      status: "normal",
    };

    render(<TenantMeter usage={normalUsage} loading={false} />);

    expect(screen.getByTestId("quota-normal-badge")).toBeInTheDocument();
    expect(screen.getByText(/Healthy Allocation/i)).toBeInTheDocument();
    expect(screen.getByText(/30% monthly capacity utilized/i)).toBeInTheDocument();
  });

  it("renders warning badge when usage reaches 80% threshold", () => {
    const warningUsage: TenantUsageSummary = {
      id: "t2",
      name: "Globex Dynamics",
      monthly_token_budget: 20000,
      tokens_used: 17000,
      tokens_remaining: 3000,
      percentage_used: 85,
      status: "warning_80",
    };

    render(<TenantMeter usage={warningUsage} loading={false} />);

    expect(screen.getByTestId("quota-warning-badge")).toBeInTheDocument();
    expect(screen.getByText(/Warning: 80% Threshold Reached/i)).toBeInTheDocument();
    expect(screen.getByText(/85% monthly capacity utilized/i)).toBeInTheDocument();
  });

  it("renders quota exceeded badge when usage reaches 100%", () => {
    const exceededUsage: TenantUsageSummary = {
      id: "t3",
      name: "Initech",
      monthly_token_budget: 10000,
      tokens_used: 10000,
      tokens_remaining: 0,
      percentage_used: 100,
      status: "exceeded_100",
    };

    render(<TenantMeter usage={exceededUsage} loading={false} />);

    expect(screen.getByTestId("quota-exceeded-badge")).toBeInTheDocument();
    expect(screen.getByText(/Quota Exceeded \(100%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/0 tokens remaining/i)).toBeInTheDocument();
  });
});
