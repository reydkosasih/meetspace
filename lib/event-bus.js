import { EventEmitter } from "events";

/**
 * In-process event bus for broadcasting real-time mutations to SSE clients.
 * Using a global singleton ensures the same instance is reused across Next.js
 * hot-reloads in development without leaking listeners.
 */
const eventBus = global.__meetspaceEventBus ?? new EventEmitter();
eventBus.setMaxListeners(500); // support many concurrent SSE connections

global.__meetspaceEventBus = eventBus;

export default eventBus;
