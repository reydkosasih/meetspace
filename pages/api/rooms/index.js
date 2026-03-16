import { prisma } from "@/lib/prisma";
import { sendError, sendMethodNotAllowed, requireFields } from "@/lib/api";
import { requireAdmin } from "@/lib/access";
import { serializeRoom } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const activeOnly = req.query.activeOnly === "1";
    const rooms = await prisma.room.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return res.status(200).json({ rooms: rooms.map(serializeRoom) });
  }

  if (req.method === "POST") {
    const user = await requireAdmin(req, res);
    if (!user) {
      return undefined;
    }

    try {
      requireFields(req.body || {}, ["name", "capacity", "floor", "color"]);
      const room = await prisma.room.create({
        data: {
          name: String(req.body.name).trim(),
          capacity: Number(req.body.capacity),
          floor: String(req.body.floor).trim(),
          color: String(req.body.color).trim(),
          description: req.body.description ? String(req.body.description).trim() : null,
          amenities: Array.isArray(req.body.amenities) ? req.body.amenities : [],
          active: req.body.active ?? true,
        },
      });

      const serialized = serializeRoom(room);
      eventBus.emit("update", { kind: "room:create", payload: serialized });
      return res.status(201).json({ room: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to create room.");
    }
  }

  return sendMethodNotAllowed(res, ["GET", "POST"]);
}
