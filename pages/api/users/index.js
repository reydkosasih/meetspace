import { prisma } from "@/lib/prisma";
import { sendError, sendMethodNotAllowed, requireFields, parseInteger } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { requireAdmin, requireAuth } from "@/lib/access";
import { serializeUser } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

function normalizeRole(role) {
  const normalized = String(role || "MEMBER").trim().toUpperCase();
  if (!["ADMIN", "MEMBER", "VIEWER"].includes(normalized)) {
    throw new Error("Unsupported user role.");
  }

  return normalized;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const requester = await requireAuth(req, res);
    if (!requester) {
      return undefined;
    }

    const users = await prisma.user.findMany({
      where: requester.role === "ADMIN" ? undefined : { active: true },
      include: { department: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return res.status(200).json({ users: users.map(serializeUser) });
  }

  if (req.method === "POST") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return undefined;
    }

    try {
      requireFields(req.body || {}, ["name", "email", "password"]);

      const passwordHash = await hashPassword(String(req.body.password));
      const user = await prisma.user.create({
        data: {
          name: String(req.body.name).trim(),
          email: String(req.body.email).trim().toLowerCase(),
          passwordHash,
          phone: req.body.phone ? String(req.body.phone).trim() : null,
          role: normalizeRole(req.body.role),
          active: req.body.active ?? true,
          avatarColor: req.body.avatarColor ? String(req.body.avatarColor).trim() : "#6366f1",
          departmentId: req.body.departmentId ? parseInteger(req.body.departmentId) : null,
        },
        include: { department: true },
      });

      const serialized = serializeUser(user);
      eventBus.emit("update", { kind: "user:create", payload: serialized });
      return res.status(201).json({ user: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to create user.");
    }
  }

  return sendMethodNotAllowed(res, ["GET", "POST"]);
}
