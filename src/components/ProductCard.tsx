import Link from "next/link";
import { percentOff, rupees } from "@/lib/utils";

type P = { slug: string; name: string; originalPrice: number; sellingPrice: number; images: { url: string }[] };

export default function ProductCard({ p }: { p: P }) {
  const off = percentOff(p.originalPrice, p.sellingPrice);
  return (
    <Link href={`/products/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.images[0] && <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
        {off > 0 && <span className="absolute left-2 top-2 rounded bg-madder px-2 py-0.5 text-xs font-bold text-white">{off}% off</span>}
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold">{p.name}</h3>
      <p className="text-sm">
        <span className="font-bold">{rupees(p.sellingPrice)}</span>
        {off > 0 && <span className="ml-2 text-ink/50 line-through">{rupees(p.originalPrice)}</span>}
      </p>
    </Link>
  );
}
