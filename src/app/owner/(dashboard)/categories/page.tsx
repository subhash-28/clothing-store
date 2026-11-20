import CategoryManager from "@/components/CategoryManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <h1 className="text-3xl font-extrabold">Categories</h1>
      <p className="mt-2 text-sm text-ink/65">Create collections, change their names, and upload images shown on the homepage.</p>
      <CategoryManager initialCategories={categories} />
    </>
  );
}
