import { buildLogoutCookie } from "@/lib/auth";
import { sendMethodNotAllowed } from "@/lib/api";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendMethodNotAllowed(res, ["POST"]);
  }

  res.setHeader("Set-Cookie", buildLogoutCookie());
  return res.status(200).json({ success: true });
}
