export function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.toLowerCase(),
    active: user.active,
    avatarColor: user.avatarColor,
    department: user.department?.name || null,
    departmentId: user.departmentId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeDepartment(department) {
  if (!department) {
    return null;
  }

  return {
    id: department.id,
    name: department.name,
    color: department.color,
    description: department.description,
    head: department.head?.name || null,
    headId: department.headId,
    active: department.active,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

export function serializeRoom(room) {
  if (!room) {
    return null;
  }

  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    floor: room.floor,
    color: room.color,
    amenities: Array.isArray(room.amenities) ? room.amenities : [],
    description: room.description,
    active: room.active,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

export function serializeBooking(booking) {
  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    roomId: booking.roomId,
    title: booking.title,
    date: booking.bookingDate.toISOString().split("T")[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    organizer: booking.organizer?.name || null,
    organizerId: booking.organizerId,
    department: booking.department?.name || null,
    departmentId: booking.departmentId,
    attendees: booking.attendees,
    status: booking.status.toLowerCase(),
    checkinCode: booking.checkinCode,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}
