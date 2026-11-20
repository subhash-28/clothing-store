import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Page() {
  const settings = await getSiteSettings();
  return <Suspense><AuthForm mode="register" siteName={settings.siteName} tagline={settings.tagline} /></Suspense>;
}
