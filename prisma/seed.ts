import { loadEnvConfig } from "@next/env";
import { PrismaClient, Size } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizePhoneNumber } from "../src/lib/phone";

loadEnvConfig(process.cwd());
const db = new PrismaClient();

const categories = [
  "Men's Clothing", "Women's Clothing", "Kids' Clothing", "Traditional Wear",
  "Western Wear", "Casual Wear", "Ethnic Wear", "Accessories",
];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });

  for (const name of categories) {
    await db.category.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const phoneInput = process.env.ADMIN_PHONE?.trim();
  const phone = phoneInput ? normalizePhoneNumber(phoneInput) : null;
  if (phoneInput && !/^\d{7,15}$/.test(phone ?? "")) {
    throw new Error("ADMIN_PHONE must contain 7 to 15 digits, optionally formatted with +, spaces, or punctuation.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash, ...(phone ? { phone } : {}) },
    create: { name: "Store Owner", email, phone, passwordHash, role: "ADMIN" },
  });

  const cat = await db.category.findUniqueOrThrow({ where: { slug: "casual-wear" } });
  const exists = await db.product.findUnique({ where: { slug: "classic-linen-shirt" } });
  if (!exists) {
    const sizes: Size[] = ["S", "M", "L", "XL"];
    await db.product.create({
      data: {
        name: "Classic Linen Shirt",
        slug: "classic-linen-shirt",
        description: "Breathable linen shirt with a relaxed fit. Easy for Hyderabad summers.",
        material: "100% linen",
        originalPrice: 249900,
        sellingPrice: 179900,
        categoryId: cat.id,
        isFeatured: true,
        isBestSeller: true,
        images: { create: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", publicId: "seed/sample-shirt", position: 0 }] },
        variants: {
          create: sizes.flatMap((size) =>
            ["White", "Navy"].map((color) => ({
              size, color, sku: `LINEN-${size}-${color.toUpperCase()}`,
              inventory: { create: { quantity: 20 } },
            }))
          ),
        },
      },
    });
  }
  console.log(`Seeded. Admin login: ${email}`);
}

main().finally(() => db.$disconnect());
