import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { totalAmount } = await req.json();

    if (typeof totalAmount !== "number") {
      return NextResponse.json(
        { error: "totalAmount is missing" },
        { status: 400 }
      );
    }

    // === 農水省データを基準にした評価 ===
    // 日本の家庭フードロス平均：約100g/日
    let rank = "";
    let reason = "";

    if (totalAmount >= 300) {
      rank = "S";
      reason =
        "日本の家庭平均（約100g/日）を大きく上回っており、フードロス削減の優先度が非常に高い状態です。";
    } else if (totalAmount >= 150) {
      rank = "A";
      reason =
        "家庭フードロス平均を上回っており、早めの消費行動が推奨されます。";
    } else if (totalAmount >= 80) {
      rank = "B";
      reason =
        "家庭フードロス平均と同程度であり、計画的な調理が望まれます。";
    } else {
      rank = "C";
      reason =
        "家庭フードロス平均を下回っており、比較的良好な状態です。";
    }

    return NextResponse.json({
      rank,
      reason,
      reference:
        "農林水産省「食品ロス量（家庭系）」統計を基準に判定",
    });
  } catch (e) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
