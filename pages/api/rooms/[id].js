import { prisma } from "@/lib/prisma";
import { parseInteger, sendError, sendMethodNotAllowed } from "@/lib/api";
import { requireAdmin } from "@/lib/access";
import { serializeRoom } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

function buildRoomUpdateData(payload) {
  const data = {};

  if (payload.name !== undefined) {
    data.name = String(payload.name).trim();
  }

  if (payload.capacity !== undefined) {
    data.capacity = Number(payload.capacity);
  }

  if (payload.floor !== undefined) {
    data.floor = String(payload.floor).trim();
  }

  if (payload.color !== undefined) {
    data.color = String(payload.color).trim();
  }

  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.amenities !== undefined) {
    data.amenities = Array.isArray(payload.amenities) ? payload.amenities : [];
  }

  if (payload.active !== undefined) {
    data.active = Boolean(payload.active);
  }

  return data;
}

export default async function handler(req, res) {
  const roomId = parseInteger(req.query.id);
  if (!roomId) {
    return sendError(res, 400, "Invalid room id.");
  }

  if (req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return undefined;
    }

    try {
      const data = buildRoomUpdateData(req.body || {});
      if (Object.keys(data).length === 0) {
        throw new Error("No room fields provided.");
      }

      if (data.capacity !== undefined && (!Number.isFinite(data.capacity) || data.capacity < 1)) {
        throw new Error("Room capacity must be at least 1.");
      }

      const room = await prisma.room.update({
        where: { id: roomId },
        data,
      });

      const serialized = serializeRoom(room);
      eventBus.emit("update", { kind: "room:update", payload: serialized });
      return res.status(200).json({ room: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to update room.");
    }
  }

  if (req.method === "DELETE") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return undefined;
    }

    try {
      const roomBookings = await prisma.booking.findMany({
        where: { roomId },
        select: { id: true },
      });

      await prisma.$transaction([
        prisma.booking.deleteMany({ where: { roomId } }),
        prisma.room.delete({ where: { id: roomId } }),
      ]);

      const deletedBookingIds = roomBookings.map((booking) => booking.id);
      eventBus.emit("update", { kind: "room:delete", payload: { roomId, deletedBookingIds } });
      return res.status(200).json({ success: true, roomId, deletedBookingIds });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to delete room.");
    }
  }

  return sendMethodNotAllowed(res, ["PATCH", "DELETE"]);
}