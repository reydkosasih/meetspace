import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

import { prisma } from "./prisma";

const AUTH_COOKIE_NAME = "meetspace_auth";
const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function shouldUseSecureCookies(req) {
  if (process.env.AUTH_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.AUTH_COOKIE_SECURE === "false") {
    return false;
  }

  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  if (typeof proto === "string") {
    return proto.split(",")[0].trim() === "https";
  }

  return Boolean(req?.socket?.encrypted);
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: DEFAULT_EXPIRES_IN,
    },
  );
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function buildAuthCookie(token, req, maxAge = 60 * 60 * 24 * 7) {
  return serialize(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(req),
    path: "/",
    maxAge,
  });
}

export function buildLogoutCookie(req) {
  return serialize(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(req),
    path: "/",
    maxAge: 0,
  });
}

export async function getRequestUser(req) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    include: {
      department: true,
    },
  });
}
