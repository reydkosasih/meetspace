async function request(url, options = {}) {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, requestOptions);
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload;
}

export const clientApi = {
  auth: {
    login: (credentials) => request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    me: () => request("/api/auth/me"),
  },
  rooms: {
    list: () => request("/api/rooms"),
    create: (room) => request("/api/rooms", { method: "POST", body: JSON.stringify(room) }),
    update: (id, room) => request(`/api/rooms/${id}`, { method: "PATCH", body: JSON.stringify(room) }),
    remove: (id) => request(`/api/rooms/${id}`, { method: "DELETE" }),
  },
  departments: {
    list: () => request("/api/departments"),
    create: (department) => request("/api/departments", { method: "POST", body: JSON.stringify(department) }),
    update: (id, department) => request(`/api/departments/${id}`, { method: "PATCH", body: JSON.stringify(department) }),
    remove: (id) => request(`/api/departments/${id}`, { method: "DELETE" }),
  },
  users: {
    list: () => request("/api/users"),
    create: (user) => request("/api/users", { method: "POST", body: JSON.stringify(user) }),
    update: (id, user) => request(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(user) }),
    remove: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  },
  bookings: {
    list: () => request("/api/bookings"),
    create: (booking) => request("/api/bookings", { method: "POST", body: JSON.stringify(booking) }),
    update: (id, booking) => request(`/api/bookings/${id}`, { method: "PATCH", body: JSON.stringify(booking) }),
  },
};
