import { NextRequest, NextResponse } from "next/server";
import { feedbackService, TenantNotFoundError } from "@/services/feedback-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const usage = await feedbackService.getTenantUsage(tenantId);
    return NextResponse.json({
      success: true,
      data: usage,
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
