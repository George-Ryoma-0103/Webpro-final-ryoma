"use client";

import { useEffect, useMemo, useState } from "react";

type FoodData = {
  name: string;
  amount: number;
};

type Props = {
  foods: FoodData[];
};

type AiItem = {
  ingredient: string;
  dish: string;
  reason: string;
};

const rankColor = (rank: string) => {
  switch (rank) {
    case "S":
      return "text-red-600";     // 危険
    case "A":
      return "text-orange-500";  // やや高
    case "B":
      return "text-green-600";   // 標準
    case "C":
      return "text-gray-500";    // 良好
    default:
      return "text-gray-400";
  }
};


export default function RecipeSuggest({ foods }: Props) {
  if (foods.length === 0) return null;

  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiReason, setAiReason] = useState<string>("");
  const [aiItems, setAiItems] = useState<AiItem[]>([]);
  const [aiError, setAiError] = useState<string>("");

  // 廃棄量順
  const sortedFoods = useMemo(
    () => [...foods].sort((a, b) => b.amount - a.amount),
    [foods]
  );
  const topFoods = sortedFoods.slice(0, 3);

  /* =========================
     Cookpad（1位のみ）
  ========================= */
  const cookpadUrl = `https://cookpad.com/jp/search/${encodeURIComponent(
    sortedFoods[0]?.name ?? ""
  )}`;

  const [rank, setRank] = useState<string>("");
  const [rankReason, setRankReason] = useState<string>("");

  useEffect(() => {
    const totalAmount = topFoods.reduce((sum, f) => sum + f.amount, 0);
  
    fetch("/api/score", {   
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount }),
    })
      .then((r) => r.json())
      .then((d) => {
        setRank(d.rank ?? "");
        setRankReason(d.reason ?? "");
      })
      .catch(() => {
        setRank("");
        setRankReason("");
      });
  }, [topFoods]);
  
  const fetchAi = async () => {
    setLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foods, seed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data?.error ?? "AI提案の取得に失敗しました");
        setAiReason("");
        setAiItems([]);
        return;
      }

      setAiReason(data?.analysisReason ?? "");
      setAiItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setAiError(e?.message ?? "AI提案の取得に失敗しました");
      setAiReason("");
      setAiItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!foods || foods.length === 0) return; 
    fetchAi();
  }, [foods, seed]);

  return (
    <div className="mt-6 space-y-6 p-6 border-2 border-green-300 rounded-2xl bg-gradient-to-br from-green-50 to-white shadow">
      <div>
        <h2 className="text-xl font-extrabold text-green-700 mb-2">
        🍽️🐣 AIによるレシピ提案
        </h2>

        {/* AIの全体分析理由 */}
        <p className="text-sm mb-2">
          <span className="font-semibold text-green-700">分析理由：</span>
          {loading ? "生成中…" : aiReason || "（分析理由なし）"}
        </p>

        {/* AIエラー */}
        {aiError && (
          <p className="text-sm text-red-600 font-semibold mb-2">
            ⚠ {aiError}
          </p>
        )}

        {/* 食材ごとの提案 */}
        <ul className="space-y-2 text-sm mb-3">
          {aiItems.map((it, i) => (
            <li key={i} className="rounded-lg border bg-white p-3">
              <div className="font-bold">
                ✅ {it.ingredient}：{it.dish}
              </div>
              <div className="text-gray-700 mt-1">
                <span className="font-semibold">おすすめ理由：</span>
                {it.reason}
              </div>
            </li>
          ))}
        </ul>

        {/* 今日作るべき度（既存score APIの結果表示） */}
        <div className="text-sm mb-3">
          🔔 今日中に使って調理すべき度：
          <span
          className={`ml-1 font-bold ${rankColor(rank)}`}
          >
            {rank ? `${rank}ランク` : "（未判定）"}
            </span>
            {rankReason && (
              <p className="text-xs text-gray-600 mt-1">
                {rankReason}
                </p>
              )}
              
              <p className="text-[11px] text-gray-500 mt-1">
                ※ 日本の家庭における食品ロス平均（約100g/日：農林水産省）を基準に評価
                </p>
                </div>


        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSeed((s: number) => s + 1)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            🔄提案を再生成
          </button>

          <a
            href={cookpadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-green-600 text-green-700 rounded hover:bg-green-100"
          >
            🍳 Cookpadでレシピを見る（{sortedFoods[0].name}）
          </a>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        ※ OpenAI API をサーバー側で呼び出し、廃棄量上位食材から提案を生成しています。ランクは、廃棄量データをもとにサーバーサイドAPIが判定しています。
        <p>※ 本アプリは OpenAI API を用いたサーバーサイド分析に加え、農林水産省が公開している食品ロス統計データを参考にしています。</p>  
        <br />
        📎参考：
        <a
        href="https://www.maff.go.jp/j/shokusan/recycle/syoku_loss/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-green-700"
        >
          農林水産省 食品ロス統計
          
          </a>
          </p>
          </div>
          );
        }
