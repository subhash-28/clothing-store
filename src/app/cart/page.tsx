import CartPage from "@/components/CartPage";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CartRoute() {
  const user = await getCurrentUser();
  return <CartPage isAuthenticated={Boolean(user)} />;
}
