import { NextRequest, NextResponse } from "next/server";
import { feedbackService, TenantNotFoundError } from "@/services/feedback-service";

function extractTenantId(req: NextRequest): string | null {
  return (
    req.headers.get("x-tenant-id") ||
    req.nextUrl.searchParams.get("tenant_id") ||
    null
  );
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = extractTenantId(req);
    if (!tenantId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing tenant identification" },
        { status: 401 }
      );
    }

    const analytics = await feedbackService.getTenantAnalytics(tenantId);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    if (error instanceof TenantNotFoundError) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
