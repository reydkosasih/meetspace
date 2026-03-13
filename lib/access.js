import { sendError } from "./api";
import { getRequestUser } from "./auth";

export async function requireAuth(req, res) {
  const user = await getRequestUser(req);
  if (!user) {
    sendError(res, 401, "Authentication required.");
    return null;
  }

  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    sendError(res, 403, "Admin access required.");
    return null;
  }

  return user;
}

export async function requireBooker(req, res) {
  const user = await requireAuth(req, res);
  if (!user) {
    return null;
  }

  if (user.role === "VIEWER") {
    sendError(res, 403, "Viewer accounts cannot create bookings.");
    return null;
  }

  return user;
}
