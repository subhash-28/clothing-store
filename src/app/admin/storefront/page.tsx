import StorefrontForm from "@/components/StorefrontForm";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminStorefront() {
  const settings = await getSiteSettings();

  return (
    <>
      <h1 className="text-3xl font-extrabold">Website settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Update your brand, contact information, images, and the text customers see on the homepage.
      </p>
      <StorefrontForm initialSettings={settings} />
    </>
  );
}
