import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/login-rate-limit";

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  const limit = await consumeLoginAttempt("customer", parsed.data.email);
  if (limit.limited) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  if (user.role !== "CUSTOMER") {
    await clearLoginAttempts("customer", parsed.data.email);
    return NextResponse.json({ error: "Owner accounts must sign in through the owner login." }, { status: 403 });
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await clearLoginAttempts("customer", parsed.data.email);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
