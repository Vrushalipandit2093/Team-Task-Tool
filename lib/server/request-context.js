import { getAdminSession } from "./admin-auth.js";
import { getMemberSession } from "./member-auth.js";

export async function getActorSession() {
  const [adminSession, memberSession] = await Promise.all([
    getAdminSession(),
    getMemberSession(),
  ]);

  if (adminSession.authenticated) {
    return {
      authenticated: true,
      id: "admin",
      name: "Admin",
      email: adminSession.email,
      role: "Admin",
      accessRole: "admin",
    };
  }

  if (memberSession.authenticated) {
    return memberSession;
  }

  return { authenticated: false };
}
