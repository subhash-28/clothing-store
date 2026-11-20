import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <h1 className="text-3xl font-extrabold">Add product</h1>
      <ProductForm categories={categories} />
    </>
  );
}
