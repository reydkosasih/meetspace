const BUFFER_MINUTES = 10;

const ACTIVE_BOOKING_STATUSES = ["CONFIRMED", "CHECKED_IN", "COMPLETED"];

export function timeToMinutes(timeValue) {
  const [hours, minutes] = String(timeValue).split(":").map(Number);
  return hours * 60 + minutes;
}

export function hasBookingConflict(bookings, startTime, endTime, excludeId = null) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return bookings.some((booking) => {
    if (excludeId && booking.id === excludeId) {
      return false;
    }

    if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      return false;
    }

    const bookingStart = timeToMinutes(booking.startTime) - BUFFER_MINUTES;
    const bookingEnd = timeToMinutes(booking.endTime) + BUFFER_MINUTES;

    return start < bookingEnd && end > bookingStart;
  });
}

export function normalizeBookingStatus(status) {
  const normalized = String(status || "CONFIRMED").trim().toUpperCase();
  const supportedStatuses = ["CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];

  if (!supportedStatuses.includes(normalized)) {
    throw new Error("Unsupported booking status.");
  }

  return normalized;
}

export function getBufferMinutes() {
  return BUFFER_MINUTES;
}
