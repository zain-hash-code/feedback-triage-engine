import { NextRequest, NextResponse } from "next/server";
import { feedbackService, QuotaExceededError, TenantNotFoundError } from "@/services/feedback-service";
import { CreateFeedbackInputSchema } from "@/lib/types";

function extractTenantId(req: NextRequest): string | null {
  return (
    req.headers.get("x-tenant-id") ||
    req.nextUrl.searchParams.get("tenant_id") ||
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = extractTenantId(req);
    if (!tenantId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing required 'x-tenant-id' header or 'tenant_id' parameter" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationResult = CreateFeedbackInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_FAILED",
          message: "Validation failed for feedback input",
          issues: validationResult.error.issues,
        },
        { status: 422 }
      );
    }

    const entry = await feedbackService.ingestFeedback(tenantId, validationResult.data);

    return NextResponse.json(
      {
        success: true,
        message: "Feedback accepted and scheduled for AI triage",
        data: entry,
      },
      { status: 202 }
    );
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: error.message,
          used: error.used,
          budget: error.budget,
        },
        { status: 402 }
      );
    }

    if (error instanceof TenantNotFoundError) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: error.message },
        { status: 404 }
      );
    }

    console.error("API POST /api/v1/feedback error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = extractTenantId(req);
    if (!tenantId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing required 'x-tenant-id' header or 'tenant_id' parameter" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const urgency = searchParams.get("urgency") || undefined;
    const search = searchParams.get("search") || undefined;

    const feedback = await feedbackService.listFeedback(tenantId, {
      category,
      urgency,
      search,
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    console.error("API GET /api/v1/feedback error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
