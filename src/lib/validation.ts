import { z } from "zod";
import { normalizePhoneNumber } from "@/lib/phone";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const ownerLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(254).refine((value) => {
    if (value.includes("@")) return z.string().email().safeParse(value).success;
    return /^[+0-9\s().-]+$/.test(value) && /^\d{7,15}$/.test(normalizePhoneNumber(value));
  }, "Enter a valid owner email or phone number.")
    .transform((value) => value.includes("@") ? value.toLowerCase() : normalizePhoneNumber(value)),
  password: z.string().min(1).max(100),
});

export const addCartItemSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(100),
});

export const cartItemsSchema = z.array(addCartItemSchema).max(50).superRefine((items, ctx) => {
  const ids = new Set<string>();
  for (const [index, item] of items.entries()) {
    if (ids.has(item.variantId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "variantId"], message: "Duplicate cart item." });
    }
    ids.add(item.variantId);
  }
});

export const wishlistItemSchema = z.object({
  productId: z.string().min(1).max(64),
});

const optionalRupees = z.preprocess(
  (value) => value === "" || value === undefined ? undefined : value,
  z.coerce.number().finite().min(0).max(1_000_000).optional(),
);

export const catalogFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().default("newest"),
  min: optionalRupees,
  max: optionalRupees,
}).refine((filters) => filters.min === undefined || filters.max === undefined || filters.min <= filters.max, {
  message: "Minimum price cannot be greater than maximum price.",
  path: ["min"],
});

export const storefrontSchema = z.object({
  siteName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().min(2).max(120),
  logoUrl: z.string().url().nullable(),
  logoPublicId: z.string().max(255).nullable(),
  footerText: z.string().trim().min(2).max(500),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().trim().max(40).nullable(),
  instagramUrl: z.string().url().nullable(),
  facebookUrl: z.string().url().nullable(),
  youtubeUrl: z.string().url().nullable(),
  heroTitle: z.string().trim().min(2).max(120),
  heroDescription: z.string().trim().min(10).max(300),
  heroBackgroundUrl: z.string().url().nullable(),
  heroBackgroundPublicId: z.string().max(255).nullable(),
  ctaLabel: z.string().trim().min(2).max(40),
  ctaLink: z.string().trim().min(1).max(2048).refine((value) => value.startsWith("/") && !value.startsWith("//"), "Use a link inside this website."),
  promoBannerText: z.string().trim().max(160).nullable(),
  featuredTitle: z.string().trim().min(2).max(80),
  newArrivalsTitle: z.string().trim().min(2).max(80),
  bestSellersTitle: z.string().trim().min(2).max(80),
}).superRefine((settings, ctx) => {
  for (const field of ["instagramUrl", "facebookUrl", "youtubeUrl"] as const) {
    const value = settings[field];
    if (value && new URL(value).protocol !== "https:") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Social links must use HTTPS." });
    }
  }
  if (Boolean(settings.logoUrl) !== Boolean(settings.logoPublicId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["logoUrl"], message: "Upload a logo image or clear both logo fields." });
  }
  if (Boolean(settings.heroBackgroundUrl) !== Boolean(settings.heroBackgroundPublicId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroBackgroundUrl"], message: "Upload a hero image or clear both image fields." });
  }
});

export const bannerSchema = z.object({
  imageUrl: z.string().url(),
  publicId: z.string().min(1).max(255),
  altText: z.string().trim().min(2).max(160),
  title: z.string().trim().max(120).nullable(),
  description: z.string().trim().max(300).nullable(),
  buttonText: z.string().trim().max(40).nullable(),
  buttonLink: z.string().trim().max(2048).nullable(),
  isActive: z.boolean().default(true),
}).superRefine((banner, ctx) => {
  if (Boolean(banner.buttonText) !== Boolean(banner.buttonLink)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["buttonLink"], message: "Provide both button text and a button link." });
  }
  if (banner.buttonLink && (!banner.buttonLink.startsWith("/") || banner.buttonLink.startsWith("//"))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["buttonLink"], message: "Use a link inside this website." });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  imageUrl: z.string().url().nullable(),
  imagePublicId: z.string().max(255).nullable(),
}).superRefine((category, ctx) => {
  if (Boolean(category.imageUrl) !== Boolean(category.imagePublicId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["imageUrl"], message: "Upload an image or clear both image fields." });
  }
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(5000),
  material: z.string().trim().max(200).nullable(),
  originalPrice: z.number().int().positive().max(2_147_483_647),
  sellingPrice: z.number().int().positive().max(2_147_483_647),
  categoryId: z.string().min(1),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  variants: z.array(z.object({
    id: z.string().optional(),
    size: z.enum(SIZES),
    color: z.string().trim().min(1).max(30),
    stock: z.number().int().min(0).max(100000),
  })).min(1).max(120),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url(),
    publicId: z.string().min(1).max(255),
  })).min(1).max(8),
}).superRefine((product, ctx) => {
  if (product.sellingPrice > product.originalPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sellingPrice"], message: "Selling price cannot exceed original price." });
  }
  const variantKeys = new Set<string>();
  for (const [index, variant] of product.variants.entries()) {
    const key = `${variant.size}:${variant.color.toLowerCase()}`;
    if (variantKeys.has(key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["variants", index], message: "Each size and colour combination must be unique." });
    }
    variantKeys.add(key);
  }
});

export const couponCreateSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(32).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive().max(2_147_483_647),
  minOrder: z.number().int().min(0).max(2_147_483_647).default(0),
  maxDiscount: z.number().int().positive().max(2_147_483_647).nullable(),
  usageLimit: z.number().int().positive().max(2_147_483_647).nullable(),
  expiresAt: z.string().date().nullable(),
}).superRefine((coupon, ctx) => {
  if (coupon.type === "PERCENT" && coupon.value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Percentage coupons cannot exceed 100%." });
  }
  if (coupon.expiresAt && new Date(`${coupon.expiresAt}T23:59:59.999Z`) <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Expiry date must be in the future." });
  }
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(5000),
    material: z.string().trim().max(200).optional().default(""),
    originalPrice: z.number().int().positive(), // paise
    sellingPrice: z.number().int().positive(),
    categoryId: z.string().min(1),
    sizes: z.array(z.enum(SIZES)).min(1),
    colors: z.array(z.string().trim().min(1).max(30)).min(1),
    stock: z.number().int().min(0).max(100000),
    isFeatured: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    images: z.array(z.object({ url: z.string().url(), publicId: z.string().min(1) })).min(1).max(8),
  })
  .refine((p) => p.sellingPrice <= p.originalPrice, { message: "Selling price cannot exceed original price", path: ["sellingPrice"] });

export type ProductInput = z.infer<typeof productSchema>;
