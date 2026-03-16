import eventBus from "@/lib/event-bus";

/**
 * GET /api/events
 *
 * Server-Sent Events stream.  The client keeps this connection open and
 * receives push notifications whenever a room, department, booking, or user
 * is mutated by *any* connected client.
 *
 * Event format:
 *   data: {"kind":"booking:create","payload":{…}}\n\n
 *
 * A heartbeat comment (": heartbeat") is sent every 25 seconds to prevent
 * proxy / load-balancer timeouts.
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  // ── SSE headers ────────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Disable response buffering in Nginx / Apache reverse-proxy environments
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // ── Initial connected acknowledgement ──────────────────────────────────────
  res.write(`data: ${JSON.stringify({ kind: "connected" })}\n\n`);

  // ── Forward events from the in-process bus ─────────────────────────────────
  const onEvent = (event) => {
    // Each SSE message must end with a blank line (\n\n)
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.on("update", onEvent);

  // ── Keep-alive heartbeat ───────────────────────────────────────────────────
  const heartbeat = setInterval(() => {
    // SSE comment lines (: …) keep the connection alive without triggering the
    // client's onmessage handler
    res.write(": heartbeat\n\n");
  }, 25_000);

  // ── Clean up when the client disconnects ──────────────────────────────────
  req.on("close", () => {
    clearInterval(heartbeat);
    eventBus.off("update", onEvent);
  });
}

// Disable the default Next.js body parser for streaming responses
export const config = { api: { bodyParser: false } };
