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
        primaryTaskId: String(recommendation.primaryTaskId),
        primaryTaskTitle: recommendation.primaryTaskTitle,
        explanation: recommendation.explanation,
        alternatives: recommendation.alternatives.map((alternative) => ({
          taskId: String(alternative.taskId),
          whyNotFirst: alternative.whyNotFirst,
        })),
        possiblePrerequisites: recommendation.possiblePrerequisites.map(
          (prerequisite) => ({
            taskId: String(prerequisite.taskId),
            reason: prerequisite.reason,
          }),
        ),
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
