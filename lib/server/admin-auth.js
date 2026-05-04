import "dotenv/config";
import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "team_tasks_admin_session";

function getAdminConfig() {
  return {
    email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "",
    secret: process.env.ADMIN_SESSION_SECRET || "team-task-manager-admin-secret",
  };
}

function signValue(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminConfigured() {
  const { email, password } = getAdminConfig();
  return Boolean(email && password);
}

export function validateAdminCredentials(email, password) {
  const config = getAdminConfig();
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!config.email || !config.password) {
    return false;
  }

  return (
    safeEqual(normalizedEmail, config.email) &&
    safeEqual(password || "", config.password)
  );
}

export function createAdminSessionValue(email) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const { secret } = getAdminConfig();
  const signature = signValue(normalizedEmail, secret);
  const encodedEmail = Buffer.from(normalizedEmail, "utf8").toString("base64url");
  return `${encodedEmail}.${signature}`;
}

export function parseAdminSessionValue(value) {
  if (!value || !value.includes(".")) {
    return null;
  }

  const separatorIndex = value.lastIndexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const encodedEmail = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const email = Buffer.from(encodedEmail, "base64url").toString("utf8");
  const config = getAdminConfig();
  const expectedSignature = signValue(email, config.secret);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  if (email !== config.email) {
    return null;
  }

  return { email, authenticated: true };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return parseAdminSessionValue(sessionCookie) || { authenticated: false };
}

export function buildAdminSessionCookie(value) {
  return {
    cookieName: ADMIN_SESSION_COOKIE,
    cookieValue: value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  };
}

export function buildAdminLogoutCookie() {
  return {
    cookieName: ADMIN_SESSION_COOKIE,
    cookieValue: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}
