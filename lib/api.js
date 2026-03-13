export function sendMethodNotAllowed(res, allowedMethods) {
  res.setHeader("Allow", allowedMethods.join(", "));
  return res.status(405).json({ error: `Method ${allowedMethods.join("/")} only.` });
}

export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

export function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === "");
  if (missing.length > 0) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}.`);
  }
}
