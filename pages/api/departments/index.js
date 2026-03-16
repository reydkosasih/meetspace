import { prisma } from "@/lib/prisma";
import { sendError, sendMethodNotAllowed, requireFields, parseInteger } from "@/lib/api";
import { requireAdmin } from "@/lib/access";
import { serializeDepartment } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const activeOnly = req.query.activeOnly === "1";
    const departments = await prisma.department.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: { head: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return res.status(200).json({ departments: departments.map(serializeDepartment) });
  }

  if (req.method === "POST") {
    const user = await requireAdmin(req, res);
    if (!user) {
      return undefined;
    }

    try {
      requireFields(req.body || {}, ["name", "color"]);

      const headId = req.body.headId ? parseInteger(req.body.headId) : null;
      const department = await prisma.department.create({
        data: {
          name: String(req.body.name).trim(),
          color: String(req.body.color).trim(),
          description: req.body.description ? String(req.body.description).trim() : null,
          active: req.body.active ?? true,
          headId,
        },
        include: { head: true },
      });

      const serialized = serializeDepartment(department);
      eventBus.emit("update", { kind: "department:create", payload: serialized });
      return res.status(201).json({ department: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to create department.");
    }
  }

  return sendMethodNotAllowed(res, ["GET", "POST"]);
}
