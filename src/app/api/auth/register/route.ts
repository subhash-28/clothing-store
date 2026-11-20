import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your details. Password needs 8+ characters." }, { status: 400 });
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12), lastLoginAt: new Date() }, // role defaults to CUSTOMER
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
