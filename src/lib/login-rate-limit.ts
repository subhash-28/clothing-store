import { createHash } from "crypto";
import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getRateLimitKey(area: "customer" | "owner", identifier: string) {
  return createHash("sha256").update(`${area}:${identifier}`).digest("hex");
}

export async function consumeLoginAttempt(area: "customer" | "owner", identifier: string) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_MS);
  const key = getRateLimitKey(area, identifier);

  await db.loginRateLimit.deleteMany({
    where: { windowStartedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  const [record] = await db.$queryRaw<Array<{ attempts: number; windowStartedAt: Date }>>`
    INSERT INTO "LoginRateLimit" ("key", "windowStartedAt", "attempts")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE
        WHEN "LoginRateLimit"."windowStartedAt" <= ${cutoff} THEN 1
        ELSE "LoginRateLimit"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "LoginRateLimit"."windowStartedAt" <= ${cutoff} THEN ${now}
        ELSE "LoginRateLimit"."windowStartedAt"
      END
    RETURNING "attempts", "windowStartedAt"
  `;

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((record.windowStartedAt.getTime() + WINDOW_MS - now.getTime()) / 1000),
  );
  return { limited: record.attempts > MAX_ATTEMPTS, retryAfterSeconds };
}

export async function clearLoginAttempts(area: "customer" | "owner", identifier: string) {
  await db.loginRateLimit.deleteMany({ where: { key: getRateLimitKey(area, identifier) } });
}
