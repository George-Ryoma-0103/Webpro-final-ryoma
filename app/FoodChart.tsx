"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type FoodData = {
  name: string;
  amount: number;
};

export default function FoodChart({ foods }: { foods: FoodData[] }) {
  if (foods.length === 0) return null;

  const data = {
    labels: foods.map((f) => f.name),
    datasets: [
      {
        label: "食品ロス量 (g)",
        data: foods.map((f) => f.amount),
      },
    ],
  };

  return <Bar data={data} />;
}
