import { NextRequest, NextResponse } from "next/server";
import { feedbackService, FeedbackNotFoundError } from "@/services/feedback-service";
import { UpdateFeedbackInputSchema } from "@/lib/types";
import { prisma } from "@/lib/prisma";

function extractTenantId(req: NextRequest): string | null {
  return (
    req.headers.get("x-tenant-id") ||
    req.nextUrl.searchParams.get("tenant_id") ||
    null
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = extractTenantId(req);
    if (!tenantId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing tenant identification" },
        { status: 401 }
      );
    }

    const item = await prisma.feedbackEntry.findFirst({
      where: {
        id: params.id,
        tenant_id: tenantId,
      },
      include: {
        analysis: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Feedback entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = extractTenantId(req);
    if (!tenantId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing tenant identification" },
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

    const validation = UpdateFeedbackInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", issues: validation.error.issues },
        { status: 422 }
      );
    }

    const updated = await feedbackService.updateFeedback(params.id, tenantId, validation.data);

    return NextResponse.json({
      success: true,
      message: "Feedback entry updated successfully",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof FeedbackNotFoundError) {
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
