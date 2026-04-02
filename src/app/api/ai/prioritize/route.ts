import { NextResponse } from "next/server";
import { getPrioritizationRecommendation } from "@/services/prioritization.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const recommendation = await getPrioritizationRecommendation();

    if (!recommendation) {
      return NextResponse.json({
        data: null,
        message: "No open tasks to prioritize.",
      });
    }

    return NextResponse.json({
      data: {
        recommendedTaskId: String(recommendation.recommendedTaskId),
        recommendedTaskTitle: recommendation.recommendedTaskTitle,
        explanation: recommendation.explanation,
        confidence: recommendation.confidence,
      },
    });
  } catch (error) {
    console.error("AI prioritization route error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate prioritization recommendation.",
      },
      { status: 500 },
    );
  }
}
