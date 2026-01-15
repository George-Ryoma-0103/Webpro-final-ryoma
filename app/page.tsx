import FoodForm from "./FoodForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
      <h1 className="text-4xl font-extrabold text-green-700 tracking-wide">
  フードロス可視化 × レシピ提案
</h1>


        <FoodForm />
      </div>
    </main>
  );
}
