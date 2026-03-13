import { prisma } from "@/lib/prisma";
import { parseInteger, sendError, sendMethodNotAllowed } from "@/lib/api";
import { requireAdmin } from "@/lib/access";
import { serializeDepartment } from "@/lib/serializers";

function buildDepartmentUpdateData(payload) {
  const data = {};

  if (payload.name !== undefined) {
    data.name = String(payload.name).trim();
  }

  if (payload.color !== undefined) {
    data.color = String(payload.color).trim();
  }

  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.active !== undefined) {
    data.active = Boolean(payload.active);
  }

  if (payload.headId !== undefined) {
    data.headId = payload.headId ? parseInteger(payload.headId) : null;
  }

  return data;
}

export default async function handler(req, res) {
  const departmentId = parseInteger(req.query.id);
  if (!departmentId) {
    return sendError(res, 400, "Invalid department id.");
  }

  if (req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return undefined;
    }

    try {
      const data = buildDepartmentUpdateData(req.body || {});
      if (Object.keys(data).length === 0) {
        throw new Error("No department fields provided.");
      }

      const department = await prisma.department.update({
        where: { id: departmentId },
        data,
        include: { head: true },
      });

      return res.status(200).json({ department: serializeDepartment(department) });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to update department.");
    }
  }

  if (req.method === "DELETE") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return undefined;
    }

    try {
      await prisma.department.delete({ where: { id: departmentId } });
      return res.status(200).json({ success: true, departmentId });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to delete department.");
    }
  }

  return sendMethodNotAllowed(res, ["PATCH", "DELETE"]);
}