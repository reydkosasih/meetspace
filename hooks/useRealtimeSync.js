import { useEffect, useRef } from "react";

/**
 * useRealtimeSync
 *
 * Opens a Server-Sent Events connection to /api/events and applies incoming
 * mutations directly into the controller's state setters.
 *
 * Event kinds handled:
 *   booking:create  booking:update
 *   room:create     room:update     room:delete
 *   department:create department:update  department:delete
 *   user:create     user:update     user:delete
 *
 * @param {object} setters - State setter functions from useMeetingAppController
 * @param {object|null} authUser - Current logged-in user (null = not authenticated)
 */
export function useRealtimeSync({ setBookings, setRooms, setDepartments, setUsers, setAuthUser, authUser }) {
  // Keep the latest authUser in a ref so the stable event handler can read it
  const authUserRef = useRef(authUser);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);

  useEffect(() => {
    // EventSource is browser-only
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return undefined;
    }

    let es;
    let retryTimeout;
    let retryDelay = 2000; // start with 2s back-off

    function connect() {
      es = new EventSource("/api/events");

      es.onopen = () => {
        retryDelay = 2000; // reset back-off on successful connection
      };

      es.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return; // malformed frame — ignore
        }

        const { kind, payload } = message;
        if (!kind || kind === "connected") return;

        switch (kind) {
          // ── Bookings ──────────────────────────────────────────────────────
          case "booking:create":
            setBookings((prev) =>
              prev.some((b) => b.id === payload.id) ? prev : [...prev, payload]
            );
            break;

          case "booking:update":
            setBookings((prev) =>
              prev.map((b) => b.id === payload.id ? payload : b)
            );
            break;

          // ── Rooms ─────────────────────────────────────────────────────────
          case "room:create":
            setRooms((prev) =>
              prev.some((r) => r.id === payload.id) ? prev : [...prev, payload]
            );
            break;

          case "room:update":
            setRooms((prev) =>
              prev.map((r) => r.id === payload.id ? payload : r)
            );
            break;

          case "room:delete": {
            const deletedRoomId = payload.roomId;
            const deletedIds = new Set(payload.deletedBookingIds || []);
            setRooms((prev) => prev.filter((r) => r.id !== deletedRoomId));
            setBookings((prev) => prev.filter((b) => !deletedIds.has(b.id)));
            break;
          }

          // ── Departments ───────────────────────────────────────────────────
          case "department:create":
            setDepartments((prev) =>
              prev.some((d) => d.id === payload.id) ? prev : [...prev, payload]
            );
            break;

          case "department:update":
            setDepartments((prev) =>
              prev.map((d) => d.id === payload.id ? payload : d)
            );
            // Keep denormalised department name in bookings/users in sync
            setBookings((prev) =>
              prev.map((b) =>
                b.departmentId === payload.id
                  ? { ...b, department: payload.name, departmentId: payload.id }
                  : b
              )
            );
            setUsers((prev) =>
              prev.map((u) =>
                u.departmentId === payload.id
                  ? { ...u, department: payload.name, departmentId: payload.id }
                  : u
              )
            );
            setAuthUser((current) =>
              current?.departmentId === payload.id
                ? { ...current, department: payload.name }
                : current
            );
            break;

          case "department:delete":
            setDepartments((prev) => prev.filter((d) => d.id !== payload.departmentId));
            setBookings((prev) =>
              prev.map((b) =>
                b.departmentId === payload.departmentId
                  ? { ...b, department: null, departmentId: null }
                  : b
              )
            );
            setUsers((prev) =>
              prev.map((u) =>
                u.departmentId === payload.departmentId
                  ? { ...u, department: null, departmentId: null }
                  : u
              )
            );
            setAuthUser((current) =>
              current?.departmentId === payload.departmentId
                ? { ...current, department: null, departmentId: null }
                : current
            );
            break;

          // ── Users (admin-only — ignore if not admin) ──────────────────────
          case "user:create":
            if (authUserRef.current?.role === "admin") {
              setUsers((prev) =>
                prev.some((u) => u.id === payload.id) ? prev : [...prev, payload]
              );
            }
            break;

          case "user:update":
            if (authUserRef.current?.role === "admin") {
              setUsers((prev) =>
                prev.map((u) => u.id === payload.id ? payload : u)
              );
            }
            // Always sync the current session user's own data
            setAuthUser((current) =>
              current?.id === payload.id ? { ...current, ...payload } : current
            );
            // Sync denormalised organizer name on bookings
            setBookings((prev) =>
              prev.map((b) =>
                b.organizerId === payload.id
                  ? { ...b, organizer: payload.name, organizerId: payload.id }
                  : b
              )
            );
            break;

          case "user:delete":
            if (authUserRef.current?.role === "admin") {
              setUsers((prev) => prev.filter((u) => u.id !== payload.userId));
            }
            setBookings((prev) =>
              prev.map((b) =>
                b.organizerId === payload.userId
                  ? { ...b, organizer: null, organizerId: null }
                  : b
              )
            );
            break;

          default:
            break;
        }
      };

      es.onerror = () => {
        // EventSource will attempt to reconnect automatically, but if the
        // connection is in CLOSED state we schedule a manual retry with
        // exponential back-off (cap at 30 s).
        if (es.readyState === EventSource.CLOSED) {
          retryDelay = Math.min(retryDelay * 2, 30_000);
          retryTimeout = setTimeout(connect, retryDelay);
        }
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (es) es.close();
    };
  // Intentionally empty dep-array: connection is established once on mount.
  // State setters are stable references and authUser is read via ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
