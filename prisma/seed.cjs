require("dotenv/config");

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole, BookingStatus } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL),
});

const INITIAL_ROOMS = [
  { name: "Boardroom Alpha", capacity: 20, floor: "5F", color: "#f59e0b", amenities: ["projector", "video", "whiteboard", "coffee"], description: "Executive boardroom with panoramic city view", active: true },
  { name: "Studio Beta", capacity: 8, floor: "4F", color: "#10b981", amenities: ["tv", "whiteboard", "wifi"], description: "Creative studio with writable walls", active: true },
  { name: "Hub Gamma", capacity: 12, floor: "4F", color: "#6366f1", amenities: ["projector", "video", "wifi"], description: "Mid-size collaboration hub", active: true },
  { name: "Pod Delta", capacity: 4, floor: "3F", color: "#ec4899", amenities: ["tv", "wifi"], description: "Compact focus pod", active: true },
  { name: "Arena Epsilon", capacity: 30, floor: "6F", color: "#f97316", amenities: ["projector", "video", "mic", "coffee", "whiteboard"], description: "Large training & event space", active: true },
  { name: "Lab Zeta", capacity: 6, floor: "3F", color: "#14b8a6", amenities: ["tv", "wifi", "whiteboard"], description: "Tech lab with dual screens", active: true },
];

const INITIAL_DEPARTMENTS = [
  { name: "Engineering", color: "#6366f1", description: "Software development & infrastructure", head: "Budi Santoso", active: true },
  { name: "Product", color: "#10b981", description: "Product strategy & roadmap", head: "Sari Dewi", active: true },
  { name: "Marketing", color: "#f59e0b", description: "Brand, campaigns & growth", head: "Ahmad Rizky", active: true },
  { name: "HR", color: "#ec4899", description: "People operations & culture", head: "Maya Putri", active: true },
  { name: "Finance", color: "#14b8a6", description: "Finance, budgeting & compliance", head: "Reza Pratama", active: true },
  { name: "Operations", color: "#f97316", description: "Business ops & logistics", head: "Lina Suharto", active: true },
  { name: "Legal", color: "#8b5cf6", description: "Legal affairs & contracts", head: "Doni Kusuma", active: true },
  { name: "Design", color: "#06b6d4", description: "UI/UX & visual communication", head: "Fitri Handayani", active: true },
];

const INITIAL_USERS = [
  { name: "Budi Santoso", email: "budi@company.com", password: "admin123", phone: "+62 812-0001-0001", department: "Engineering", role: UserRole.ADMIN, active: true, avatarColor: "#6366f1" },
  { name: "Sari Dewi", email: "sari@company.com", password: "admin123", phone: "+62 812-0001-0002", department: "Product", role: UserRole.ADMIN, active: true, avatarColor: "#10b981" },
  { name: "Ahmad Rizky", email: "ahmad@company.com", password: "member123", phone: "+62 812-0001-0003", department: "Marketing", role: UserRole.MEMBER, active: true, avatarColor: "#f59e0b" },
  { name: "Maya Putri", email: "maya@company.com", password: "member123", phone: "+62 812-0001-0004", department: "HR", role: UserRole.MEMBER, active: true, avatarColor: "#ec4899" },
  { name: "Reza Pratama", email: "reza@company.com", password: "member123", phone: "+62 812-0001-0005", department: "Finance", role: UserRole.MEMBER, active: true, avatarColor: "#14b8a6" },
  { name: "Lina Suharto", email: "lina@company.com", password: "member123", phone: "+62 812-0001-0006", department: "Operations", role: UserRole.MEMBER, active: true, avatarColor: "#f97316" },
  { name: "Doni Kusuma", email: "doni@company.com", password: "viewer123", phone: "+62 812-0001-0007", department: "Legal", role: UserRole.VIEWER, active: true, avatarColor: "#8b5cf6" },
  { name: "Fitri Handayani", email: "fitri@company.com", password: "member123", phone: "+62 812-0001-0008", department: "Design", role: UserRole.MEMBER, active: false, avatarColor: "#06b6d4" },
];

const BOOKING_TITLES = [
  "Weekly Sync",
  "Sprint Review",
  "Product Demo",
  "Design Review",
  "Strategy Meeting",
  "1:1",
  "All Hands",
  "Client Call",
  "Budget Review",
];

function toDateOnly(date) {
  return new Date(`${date.toISOString().split("T")[0]}T00:00:00.000Z`);
}

function buildSeedBookings(roomIds, userIds, departmentIds) {
  const today = new Date();
  const offsets = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
  const bookings = [];
  let bookingSequence = 1;

  offsets.forEach((offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const bookingDate = toDateOnly(date);
    const bookingCount = 2 + ((offset + 11) % 3);

    for (let index = 0; index < bookingCount; index += 1) {
      const roomId = roomIds[(offset + index + roomIds.length * 2) % roomIds.length];
      const organizerId = userIds[(offset + index + userIds.length * 2) % userIds.length];
      const departmentId = departmentIds[(offset + index + departmentIds.length * 2) % departmentIds.length];
      const startHour = 8 + ((index * 2 + offset + 11) % 8);
      const duration = [60, 90, 120][(offset + index + 11) % 3];
      const endMinutes = startHour * 60 + duration;
      const title = BOOKING_TITLES[(offset + index + BOOKING_TITLES.length * 2) % BOOKING_TITLES.length];

      let status = BookingStatus.CONFIRMED;
      if (offset < 0) {
        status = BookingStatus.COMPLETED;
      } else if (offset === 0 && startHour < today.getHours()) {
        status = index % 3 === 0 ? BookingStatus.NO_SHOW : BookingStatus.CHECKED_IN;
      }

      bookings.push({
        roomId,
        organizerId,
        departmentId,
        title,
        bookingDate,
        startTime: `${String(startHour).padStart(2, "0")}:00`,
        endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`,
        attendees: 2 + ((offset + index + 11) % 12),
        status,
        checkinCode: `MR${String(bookingSequence).padStart(6, "0")}`,
      });

      bookingSequence += 1;
    }
  });

  return bookings;
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const createdDepartments = [];
  for (const department of INITIAL_DEPARTMENTS) {
    const created = await prisma.department.create({
      data: {
        name: department.name,
        color: department.color,
        description: department.description,
        active: department.active,
      },
    });
    createdDepartments.push(created);
  }

  const departmentMap = new Map(createdDepartments.map((department) => [department.name, department]));
  const createdUsers = [];

  for (const user of INITIAL_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash,
        phone: user.phone,
        role: user.role,
        active: user.active,
        avatarColor: user.avatarColor,
        departmentId: departmentMap.get(user.department)?.id,
      },
    });
    createdUsers.push(created);
  }

  const userMap = new Map(createdUsers.map((user) => [user.name, user]));

  for (const department of INITIAL_DEPARTMENTS) {
    await prisma.department.update({
      where: { name: department.name },
      data: {
        headId: userMap.get(department.head)?.id ?? null,
      },
    });
  }

  const createdRooms = [];
  for (const room of INITIAL_ROOMS) {
    const created = await prisma.room.create({
      data: room,
    });
    createdRooms.push(created);
  }

  const bookings = buildSeedBookings(
    createdRooms.map((room) => room.id),
    createdUsers.map((user) => user.id),
    createdDepartments.map((department) => department.id),
  );

  for (const booking of bookings) {
    await prisma.booking.create({ data: booking });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
