import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { parseInteger, sendError, sendMethodNotAllowed } from "@/lib/api";
import { requireAdmin } from "@/lib/access";
import { serializeUser } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

function normalizeRole(role) {
  const normalized = String(role || "MEMBER").trim().toUpperCase();
  if (![
    "ADMIN",
    "MEMBER",
    "VIEWER",
  ].includes(normalized)) {
    throw new Error("Unsupported user role.");
  }

  return normalized;
}

export default async function handler(req, res) {
  const userId = parseInteger(req.query.id);
  if (!userId) {
    return sendError(res, 400, "Invalid user id.");
  }

  const admin = await requireAdmin(req, res);
  if (!admin) {
    return undefined;
  }

  if (req.method === "PATCH") {
    try {
      const data = {};

      if (req.body?.name !== undefined) {
        data.name = String(req.body.name).trim();
      }

      if (req.body?.email !== undefined) {
        data.email = String(req.body.email).trim().toLowerCase();
      }

      if (req.body?.phone !== undefined) {
        data.phone = req.body.phone ? String(req.body.phone).trim() : null;
      }

      if (req.body?.role !== undefined) {
        data.role = normalizeRole(req.body.role);
      }

      if (req.body?.active !== undefined) {
        data.active = Boolean(req.body.active);
      }

      if (req.body?.avatarColor !== undefined) {
        data.avatarColor = String(req.body.avatarColor).trim();
      }

      if (req.body?.departmentId !== undefined) {
        data.departmentId = req.body.departmentId ? parseInteger(req.body.departmentId) : null;
      }

      if (req.body?.password) {
        data.passwordHash = await hashPassword(String(req.body.password));
      }

      if (Object.keys(data).length === 0) {
        throw new Error("No user fields provided.");
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        include: { department: true },
      });

      const serialized = serializeUser(user);
      eventBus.emit("update", { kind: "user:update", payload: serialized });
      return res.status(200).json({ user: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to update user.");
    }
  }

  if (req.method === "DELETE") {
    try {
      if (admin.id === userId) {
        throw new Error("You cannot delete the current admin session.");
      }

      await prisma.user.delete({ where: { id: userId } });
      eventBus.emit("update", { kind: "user:delete", payload: { userId } });
      return res.status(200).json({ success: true, userId });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to delete user.");
    }
  }

  return sendMethodNotAllowed(res, ["PATCH", "DELETE"]);
}