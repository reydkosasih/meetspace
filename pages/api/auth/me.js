import { getRequestUser } from "@/lib/auth";
import { sendMethodNotAllowed } from "@/lib/api";
import { serializeUser } from "@/lib/serializers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendMethodNotAllowed(res, ["GET"]);
  }

  const user = await getRequestUser(req);
  return res.status(200).json({ user: serializeUser(user) });
}
