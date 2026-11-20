"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(redirectTo);
        router.refresh();
      }}
      className="text-ink/70 hover:text-madder"
    >
      Log out
    </button>
  );
}
