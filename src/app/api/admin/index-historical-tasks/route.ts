import { NextResponse } from "next/server";
import { indexHistoricalEstimationTasks } from "@/services/task-estimation-history-indexing.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const summary = await indexHistoricalEstimationTasks();

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Historical task indexing route error:", error);

    const message = error instanceof Error ? error.message : "Unknown indexing error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
