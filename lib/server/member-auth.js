import "dotenv/config";
import crypto from "crypto";
import { cookies } from "next/headers";
import { normalizeEmail } from "../shared/email.js";
import { getAccessRoleFromMemberRole } from "../shared/access.js";
import { listMembers } from "./data-store";

const MEMBER_SESSION_COOKIE = "team_tasks_member_session";

function getMemberSessionSecret() {
  return (
    process.env.MEMBER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "team-task-manager-member-secret"
  );
}

function signValue(value) {
  return crypto
    .createHmac("sha256", getMemberSessionSecret())
    .update(value)
    .digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function findLoginMemberByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const members = await listMembers();
  const member = members.find((entry) => entry.email === normalizedEmail);
  const accessRole = getAccessRoleFromMemberRole(member?.role);

  if (!member || !accessRole) {
    return null;
  }

  return {
    ...member,
    accessRole,
  };
}

export function createMemberSessionValue(email) {
  const normalizedEmail = normalizeEmail(email);
  const signature = signValue(normalizedEmail);
  const encodedEmail = Buffer.from(normalizedEmail, "utf8").toString("base64url");
  return `${encodedEmail}.${signature}`;
}

export function parseMemberSessionValue(value) {
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
  const expectedSignature = signValue(email);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  return normalizeEmail(email);
}

export async function getMemberSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(MEMBER_SESSION_COOKIE)?.value;
  const email = parseMemberSessionValue(sessionCookie);

  if (!email) {
    return { authenticated: false };
  }

  const member = await findLoginMemberByEmail(email);

  if (!member) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    accessRole: member.accessRole,
  };
}

export function buildMemberSessionCookie(value) {
  return {
    cookieName: MEMBER_SESSION_COOKIE,
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

export function buildMemberLogoutCookie() {
  return {
    cookieName: MEMBER_SESSION_COOKIE,
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
