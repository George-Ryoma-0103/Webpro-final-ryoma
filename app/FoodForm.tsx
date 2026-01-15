"use client";

import { useState, useEffect } from "react";
import FoodChart from "./FoodChart";
import RecipeSuggest from "./RecipeSuggest";

type FoodData = {
  name: string;
  amount: number;
};

const DANGER_AMOUNT = 500;

export default function FoodForm() {
  const [foods, setFoods] = useState<FoodData[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("foods");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    if (!name || !amount) return;
    setFoods([...foods, { name, amount: Number(amount) }]);
    setName("");
    setAmount("");
  };

  useEffect(() => {
    localStorage.setItem("foods", JSON.stringify(foods));
  }, [foods]);

  const dangerFood =
  foods
    .filter((f) => f.amount >= DANGER_AMOUNT)
    .sort((a, b) => b.amount - a.amount)[0]?.name || "";

    const topFoods = [...foods]
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 3);


  return (
    <div className="space-y-6 bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-xl shadow-lg">

      <div className="flex gap-2">
        <input
          className="border p-2 rounded w-1/2"
          placeholder="食品名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 rounded w-1/2"
          type="number"
          placeholder="廃棄量（g）"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button
        onClick={handleAdd}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        追加
      </button>

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
  <p>💹 入力された廃棄量は下のグラフに可視化されます。</p>
  <p>⚠️ 廃棄量が特に多い食品上位３つは警告表示されます。</p>
  <p>😊 その中でも最も廃棄量が多い食品を分析し、優先的にレシピを提案します。</p>
</div>


{foods.some((f) => f.amount >= DANGER_AMOUNT) && (
  <div className="bg-red-100 border-l-4 border-red-500 p-3 text-red-700 rounded">
    ⚠ 廃棄量が多い食品があります！
  </div>
)}

{topFoods.length > 0 && (
  <div className="bg-yellow-50 border rounded-lg p-4">
    <h3 className="text-lg font-extrabold text-yellow-800 mb-2 uppercase tracking-wide">
      🏆 廃棄量ランキング TOP3
    </h3>
    <ol className="list-decimal pl-5 space-y-1 text-sm">
      {topFoods.map((food, index) => (
        <li key={index}>
          {food.name}：{food.amount} g
        </li>
      ))}
    </ol>
  </div>
)}

      <ul className="space-y-1">
        {foods.map((food, index) => (
          <li
            key={index}
            className={`flex justify-between text-sm border-b pb-1 ${
              food.amount >= DANGER_AMOUNT
                ? "text-red-600 font-bold"
                : ""
            }`}
          >
            <span>
              {food.name}：{food.amount} g
            </span>
            <button
              className="text-red-500"
              onClick={() =>
                setFoods(foods.filter((_, i) => i !== index))
              }
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      <FoodChart foods={foods} />
      <RecipeSuggest foods={foods} />

    </div>
  );
}
