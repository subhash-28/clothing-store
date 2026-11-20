import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/login-rate-limit";
import { ownerLoginSchema } from "@/lib/validation";
import { normalizePhoneNumber } from "@/lib/phone";

export async function POST(req: Request) {
  const parsed = ownerLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid owner email or phone number and password." }, { status: 400 });
  const identifier = parsed.data.identifier;

  const limit = await consumeLoginAttempt("owner", identifier);
  if (limit.limited) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const user = identifier.includes("@")
    ? await db.user.findFirst({
      where: { email: identifier, role: "ADMIN" },
      select: { id: true, passwordHash: true },
    })
    : (await db.user.findMany({
      where: { role: "ADMIN", phone: { not: null } },
      select: { id: true, phone: true, passwordHash: true },
    })).filter((owner) => owner.phone && normalizePhoneNumber(owner.phone) === identifier);
  if (!user || Array.isArray(user) && user.length !== 1) {
    return NextResponse.json({ error: "Owner email/phone or password is incorrect." }, { status: 401 });
  }
  const matchedUser = Array.isArray(user) ? user[0] : user;
  if (!(await bcrypt.compare(parsed.data.password, matchedUser.passwordHash))) {
    return NextResponse.json({ error: "Owner email/phone or password is incorrect." }, { status: 401 });
  }

  await clearLoginAttempts("owner", identifier);
  await createSession(matchedUser.id);
  return NextResponse.json({ ok: true });
}
