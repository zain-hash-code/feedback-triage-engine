import { NextRequest, NextResponse } from "next/server";
import { feedbackService } from "@/services/feedback-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const updated = await feedbackService.resetTenantUsage(tenantId);
    return NextResponse.json({
      success: true,
      message: `Token usage for tenant ${tenantId} reset to 0`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
