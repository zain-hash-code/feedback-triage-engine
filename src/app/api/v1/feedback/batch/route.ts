import { NextRequest, NextResponse } from "next/server";
import { feedbackService } from "@/services/feedback-service";

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
        { error: "UNAUTHORIZED", message: "Missing tenant identification" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Missing or invalid 'ids' array" },
        { status: 400 }
      );
    }

    const { ids, action } = body;
    const result = await feedbackService.batchUpdateFeedback(tenantId, ids, action || {});

    return NextResponse.json({
      success: true,
      message: `Batch operation applied to ${result.count} records`,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
