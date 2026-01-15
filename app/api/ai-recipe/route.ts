import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type FoodData = { name: string; amount: number };

/* =========================
   分析観点（再生成で切り替える）
========================= */
const perspectives = [
  "廃棄量の多さを最優先に考えて",
  "調理の手軽さを重視して",
  "一度に大量消費できる点を重視して",
  "冷蔵庫整理の観点から",
  "家族で食べやすい料理を意識して",
];

/* =========================
   OpenAIが使えない時のフォールバック
========================= */
function makeFallback(foods: FoodData[], seed = 0, note?: string) {
  const sorted = [...foods].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, 3);

  const pick = (i: number) => top[i]?.name ?? top[0]?.name ?? "食材";
  const perspective = perspectives[seed % perspectives.length];

  return {
    analysisReason: `${perspective}、短時間で作れて消費量が進みやすい家庭料理を中心に提案した。`,
    items: [
      {
        ingredient: pick(0),
        dish: `${pick(0)}の具だくさん味噌汁`,
        reason: "加熱でかさが減り、大量消費しやすく失敗しにくい。",
      },
      {
        ingredient: pick(1),
        dish: `${pick(1)}の野菜炒め`,
        reason: "包丁や工程が少なく、他の余り食材もまとめて使える。",
      },
      {
        ingredient: pick(2),
        dish: `${pick(2)}の炊き込みご飯`,
        reason: "一度に多く消費でき、作り置きにも向く。",
      },
    ],
    note: note ?? "簡易提案モード（OpenAI未使用）",
    topFoods: top,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { foods, seed = 0 } = (await req.json()) as {
      foods?: FoodData[];
      seed?: number;
    };

    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return NextResponse.json(
        { error: "foods array is missing" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    /* =========================
       OpenAIが使えない場合
    ========================= */
    if (!apiKey) {
      return NextResponse.json(
        makeFallback(foods, seed, "OPENAI_API_KEY 未設定のため簡易提案モード"),
        { status: 200 }
      );
    }

    // 上位食材
    const sorted = [...foods].sort((a, b) => b.amount - a.amount);
    const topFoods = sorted.slice(0, 3);
    const perspective = perspectives[seed % perspectives.length];

    const prompt = `
以下の食材（廃棄量が多い順）を優先的に消費したい。
${perspective}献立案を考えてください。

日本の家庭向けに、調理負担が低く、消費量が多くなる献立案を3つ提案してください。
出力は必ずJSONのみで返してください。

# 入力食材
${topFoods.map((f) => `- ${f.name}: ${f.amount}g`).join("\n")}

# JSON形式（厳守）
{
  "analysisReason": "なぜこの提案になったか（短く）",
  "items": [
    { "ingredient": "食材名", "dish": "料理名", "reason": "理由（短く）" }
  ]
}
`.trim();

    try {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたはフードロス削減を支援する料理アシスタントです。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content ?? "";

      try {
        return NextResponse.json(JSON.parse(content), { status: 200 });
      } catch {
        return NextResponse.json(
          makeFallback(foods, seed, "OpenAI応答がJSON不正のため簡易提案モード"),
          { status: 200 }
        );
      }
    } catch (err: any) {
      const note =
        err?.status === 429 || err?.code === "insufficient_quota"
          ? "OpenAIの利用上限のため簡易提案モード"
          : "OpenAI呼び出し失敗のため簡易提案モード";

      return NextResponse.json(makeFallback(foods, seed, note), {
        status: 200,
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
