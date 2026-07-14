/** Direct email login — no SMTP, no magic link. POST {email} → find-or-create the user at admin-api,
 *  mint an APIToken (scopes bot,tx,browser), set the httpOnly `vexa-token` + `vexa-user-info` cookies.
 *
 *  Mirrors the dashboard's VEXA_ALLOW_DIRECT_LOGIN branch (without importing it). No email is ever sent.
 *  Must never be cached — a cached response would pin one identity for every subsequent login.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, USER_INFO_COOKIE, findOrCreateUserToken } from "../adminApi";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSecureRequest(): boolean {
  return (
    (process.env.TERMINAL_URL || "").startsWith("https://") ||
    (process.env.NEXTAUTH_URL || "").startsWith("https://") ||
    false
  );
}

export async function POST(request: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: NO_STORE });
  }

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400, headers: NO_STORE });
  }
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers: NO_STORE });
  }
  // Direct email login is a DEBUG path only — real sign-in goes through Google/Microsoft OAuth
  // (api/auth/[...nextauth]). Restrict it to test accounts so it can't be used as a password-less bypass.
  // DIRECT_LOGIN_EMAILS (comma-separated) additionally admits deployment-approved identities: anyone
  // who can reach this route can sign in as a listed email, so list only identities the operator owns.
  // The allowlist is a LOCALHOST convenience — on a deployment that declares a non-local public
  // origin it fails closed unless ALLOW_DIRECT_LOGIN_OVER_NETWORK=1 explicitly accepts that a
  // network-reachable route can mint tokens for the listed identities.
  const publicOrigin = process.env.NEXTAUTH_URL || process.env.TERMINAL_URL || "";
  const localOrigin = !publicOrigin || /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(publicOrigin);
  const allowlistActive = localOrigin || process.env.ALLOW_DIRECT_LOGIN_OVER_NETWORK === "1";
  const allowedEmails = allowlistActive
    ? (process.env.DIRECT_LOGIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (!normalized.includes("test") && !allowedEmails.includes(normalized)) {
    return NextResponse.json(
      { error: "Direct email login is restricted to test accounts or configured operator emails — use Google or Microsoft sign-in." },
      { status: 403, headers: NO_STORE },
    );
  }

  const result = await findOrCreateUserToken(normalized);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500, headers: NO_STORE });
  }

  const { user, token } = result;
  const secure = isSecureRequest();
  const cookieStore = await cookies();
  const opts = { httpOnly: true, secure, sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30, path: "/" };
  cookieStore.set(AUTH_COOKIE, token, opts);
  cookieStore.set(USER_INFO_COOKIE, JSON.stringify({ email: user.email, name: user.name || user.email.split("@")[0] }), opts);

  return NextResponse.json(
    { success: true, user: { id: user.id, email: user.email, name: user.name ?? user.email } },
    { headers: NO_STORE },
  );
}
