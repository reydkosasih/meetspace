import { prisma } from "@/lib/prisma";
import { parseInteger, sendError, sendMethodNotAllowed, requireFields } from "@/lib/api";
import { requireAuth } from "@/lib/access";
import { normalizeBookingStatus } from "@/lib/booking";
import { serializeBooking } from "@/lib/serializers";
import eventBus from "@/lib/event-bus";

export default async function handler(req, res) {
  const bookingId = parseInteger(req.query.id);
  if (!bookingId) {
    return sendError(res, 400, "Invalid booking id.");
  }

  if (req.method !== "PATCH") {
    return sendMethodNotAllowed(res, ["PATCH"]);
  }

  const user = await requireAuth(req, res);
  if (!user) {
    return undefined;
  }

  try {
    requireFields(req.body || {}, ["status"]);

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        organizer: true,
        department: true,
        room: true,
      },
    });

    if (!existingBooking) {
      return sendError(res, 404, "Booking not found.");
    }

    const canManage = user.role === "ADMIN" || existingBooking.organizerId === user.id;
    if (!canManage) {
      return sendError(res, 403, "You are not allowed to update this booking.");
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: normalizeBookingStatus(req.body.status),
      },
      include: {
        organizer: true,
        department: true,
        room: true,
      },
    });

    const serialized = serializeBooking(booking);
    eventBus.emit("update", { kind: "booking:update", payload: serialized });
    return res.status(200).json({ booking: serialized });
  } catch (error) {
    return sendError(res, 400, error.message || "Unable to update booking.");
  }
}