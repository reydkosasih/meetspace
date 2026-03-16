import { prisma } from "@/lib/prisma";
import { sendError, sendMethodNotAllowed, requireFields, parseInteger } from "@/lib/api";
import { requireBooker } from "@/lib/access";
import { hasBookingConflict, normalizeBookingStatus, timeToMinutes } from "@/lib/booking";
import { serializeBooking } from "@/lib/serializers";
import { getRequestUser } from "@/lib/auth";
import eventBus from "@/lib/event-bus";

function toDateOnly(dateValue) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid booking date.");
  }

  return date;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const requester = await getRequestUser(req);
    const where = {};

    if (req.query.date) {
      where.bookingDate = toDateOnly(String(req.query.date));
    }

    if (req.query.roomId) {
      where.roomId = parseInteger(req.query.roomId);
    }

    if (req.query.mine === "1" && requester) {
      where.organizerId = requester.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        organizer: true,
        department: true,
        room: true,
      },
      orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
    });

    return res.status(200).json({ bookings: bookings.map(serializeBooking) });
  }

  if (req.method === "POST") {
    const user = await requireBooker(req, res);
    if (!user) {
      return undefined;
    }

    try {
      requireFields(req.body || {}, ["roomId", "title", "date", "startTime", "endTime", "attendees"]);

      const roomId = parseInteger(req.body.roomId);
      const attendees = Number(req.body.attendees);
      const bookingDate = toDateOnly(String(req.body.date));
      const startTime = String(req.body.startTime);
      const endTime = String(req.body.endTime);

      if (!roomId) {
        throw new Error("Invalid room id.");
      }

      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        throw new Error("End time must be after start time.");
      }

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room || !room.active) {
        throw new Error("Selected room is unavailable.");
      }

      if (attendees < 1 || attendees > room.capacity) {
        throw new Error(`Room capacity is ${room.capacity}.`);
      }

      const sameDayBookings = await prisma.booking.findMany({
        where: {
          roomId,
          bookingDate,
        },
      });

      if (hasBookingConflict(sameDayBookings, startTime, endTime)) {
        throw new Error("Booking time conflicts with an existing meeting.");
      }

      const organizerId = user.role === "ADMIN" && req.body.organizerId ? parseInteger(req.body.organizerId) : user.id;
      const departmentId = req.body.departmentId ? parseInteger(req.body.departmentId) : user.departmentId;

      const booking = await prisma.booking.create({
        data: {
          roomId,
          title: String(req.body.title).trim(),
          bookingDate,
          startTime,
          endTime,
          organizerId,
          departmentId,
          attendees,
          status: normalizeBookingStatus(req.body.status || "confirmed"),
          checkinCode: `MR${Date.now().toString().slice(-6)}`,
        },
        include: {
          organizer: true,
          department: true,
          room: true,
        },
      });

      const serialized = serializeBooking(booking);
      eventBus.emit("update", { kind: "booking:create", payload: serialized });
      return res.status(201).json({ booking: serialized });
    } catch (error) {
      return sendError(res, 400, error.message || "Unable to create booking.");
    }
  }

  return sendMethodNotAllowed(res, ["GET", "POST"]);
}
