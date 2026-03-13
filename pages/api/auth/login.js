import { prisma } from "@/lib/prisma";
import { sendError, sendMethodNotAllowed, requireFields } from "@/lib/api";
import { buildAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendMethodNotAllowed(res, ["POST"]);
  }

  try {
    requireFields(req.body || {}, ["email", "password"]);

    const user = await prisma.user.findUnique({
      where: { email: String(req.body.email).trim().toLowerCase() },
      include: { department: true },
    });

    if (!user || !user.active) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const isValid = await verifyPassword(String(req.body.password), user.passwordHash);
    if (!isValid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const token = signAuthToken(user);
    res.setHeader("Set-Cookie", buildAuthCookie(token));

    return res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    return sendError(res, 400, error.message || "Unable to log in.");
  }
}
