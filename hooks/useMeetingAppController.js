import { useCallback, useEffect, useMemo, useState } from "react";

import { clientApi } from "@/lib/client-api";
import { ADMIN_VIEWS, NAV_ITEMS, PUBLIC_VIEWS } from "@/components/meeting-app/constants";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const MOBILE_BREAKPOINT = 860;
const TABLET_BREAKPOINT = 1180;

function timeToMin(timeValue) {
  const [hours, minutes] = String(timeValue).split(":").map(Number);
  return hours * 60 + minutes;
}

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.localStorage.getItem(key) || fallback;
}

export function useMeetingAppController() {
  const [view, setView] = useState("calendar");
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [layout, setLayout] = useState("boxed");
  const [theme, setTheme] = useState("dark");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setLayout(readStoredValue("meetspace-layout", "boxed"));
    setTheme(readStoredValue("meetspace-theme", "dark"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncViewport = () => {
      const width = window.innerWidth;
      const mobile = width < MOBILE_BREAKPOINT;
      const tablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const shouldLockBody = isMobile && sidebarOpen;
    const previousOverflow = document.body.style.overflow;

    if (shouldLockBody) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("meetspace-layout", layout);
    }
  }, [layout]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("meetspace-theme", theme);
    }
  }, [theme]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const refreshUsers = useCallback(async (currentUser) => {
    if (!currentUser) {
      setUsers([]);
      return [];
    }

    const data = await clientApi.users.list();
    const nextUsers = data?.users || [];
    setUsers(nextUsers);
    return nextUsers;
  }, []);

  const bootstrapApp = useCallback(async () => {
    setInitializing(true);

    try {
      const [roomsData, departmentsData, bookingsData, sessionData] = await Promise.all([
        clientApi.rooms.list(),
        clientApi.departments.list(),
        clientApi.bookings.list(),
        clientApi.auth.me(),
      ]);

      const currentUser = sessionData?.user || null;
      setRooms(roomsData?.rooms || []);
      setDepartments(departmentsData?.departments || []);
      setBookings(bookingsData?.bookings || []);
      setAuthUser(currentUser);

      if (currentUser) {
        await refreshUsers(currentUser);
      } else {
        setUsers([]);
      }
    } catch (error) {
      addToast(error.message || "Gagal memuat data aplikasi.", "error");
    } finally {
      setInitializing(false);
    }
  }, [addToast, refreshUsers]);

  useEffect(() => {
    bootstrapApp();
  }, [bootstrapApp]);

  // ── Real-time sync via Server-Sent Events ─────────────────────────────────
  useRealtimeSync({
    setBookings,
    setRooms,
    setDepartments,
    setUsers,
    setAuthUser,
    authUser,
  });

  const handleLogin = useCallback(async ({ email, password }) => {
    const data = await clientApi.auth.login({ email, password });
    const user = data?.user;
    setAuthUser(user);
    await refreshUsers(user);
    setShowLogin(false);
    setModal(null);
    addToast(`✓ Selamat datang, ${user.name.split(" ")[0]}!`, "success");
    return user;
  }, [addToast, refreshUsers]);

  const handleLogout = useCallback(async () => {
    try {
      await clientApi.auth.logout();
    } catch {
      // Preserve local logout even when the request fails.
    }

    setAuthUser(null);
    setUsers([]);
    if (["mybookings", "rooms", "departments", "users"].includes(view)) {
      setView("calendar");
    }
    setSidebarOpen(false);
    addToast("Anda telah keluar.", "info");
  }, [addToast, view]);

  const requireAuth = useCallback((action) => {
    if (authUser) {
      return action();
    }

    setModal({ type: "loginPrompt" });
    return undefined;
  }, [authUser]);

  const handleSaveBooking = useCallback(async (booking) => {
    try {
      const organizer = users.find((user) => user.name === booking.organizer);
      const department = departments.find((item) => item.name === booking.department);
      const payload = {
        roomId: booking.roomId,
        title: booking.title,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        attendees: booking.attendees,
      };

      if (authUser?.role === "admin" && organizer?.id) {
        payload.organizerId = organizer.id;
      }

      if (authUser?.role === "admin" && department?.id) {
        payload.departmentId = department.id;
      }

      const data = await clientApi.bookings.create(payload);
      setBookings((currentBookings) =>
        currentBookings.some((b) => b.id === data.booking.id)
          ? currentBookings
          : [...currentBookings, data.booking]
      );
      setModal(null);
      addToast(`✓ Booking "${data.booking.title}" berhasil dibuat! Konfirmasi dikirim ke email.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal membuat booking.", "error");
    }
  }, [addToast, authUser?.role, departments, users]);

  const handleCancel = useCallback(async (id) => {
    const booking = bookings.find((item) => item.id === id);

    try {
      const data = await clientApi.bookings.update(id, { status: "cancelled" });
      setBookings((currentBookings) => currentBookings.map((item) => item.id === id ? data.booking : item));
      setModal(null);
      addToast(`Booking "${booking?.title}" telah dibatalkan.`, "error");
    } catch (error) {
      addToast(error.message || "Gagal membatalkan booking.", "error");
    }
  }, [addToast, bookings]);

  const handleCheckin = useCallback(async (id) => {
    const booking = bookings.find((item) => item.id === id);

    try {
      const data = await clientApi.bookings.update(id, { status: "checked_in" });
      setBookings((currentBookings) => currentBookings.map((item) => item.id === id ? data.booking : item));
      addToast(`Check-in untuk "${booking?.title}" berhasil! Meeting dimulai.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal melakukan check-in.", "error");
    }
  }, [addToast, bookings]);

  const handleAddRoom = useCallback(async (room) => {
    try {
      const data = await clientApi.rooms.create(room);
      setRooms((currentRooms) =>
        currentRooms.some((r) => r.id === data.room.id)
          ? currentRooms
          : [...currentRooms, data.room]
      );
      setModal(null);
      addToast(`✓ Ruangan "${data.room.name}" ditambahkan.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal menambah ruangan.", "error");
    }
  }, [addToast]);

  const handleEditRoom = useCallback(async (room) => {
    try {
      const data = await clientApi.rooms.update(room.id, room);
      setRooms((currentRooms) => currentRooms.map((item) => item.id === room.id ? data.room : item));
      setModal(null);
      addToast(`Ruangan "${data.room.name}" diperbarui.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal memperbarui ruangan.", "error");
    }
  }, [addToast]);

  const handleDeleteRoom = useCallback(async (room) => {
    try {
      const data = await clientApi.rooms.remove(room.id);
      const deletedIds = new Set(data.deletedBookingIds || []);

      setRooms((currentRooms) => currentRooms.filter((item) => item.id !== room.id));
      setBookings((currentBookings) => currentBookings.filter((item) => !deletedIds.has(item.id)));
      setModal(null);
      addToast(`Ruangan "${room.name}" dihapus.`, "error");
    } catch (error) {
      addToast(error.message || "Gagal menghapus ruangan.", "error");
    }
  }, [addToast]);

  const handleToggleRoom = useCallback(async (id) => {
    const room = rooms.find((item) => item.id === id);

    try {
      const data = await clientApi.rooms.update(id, { active: !room?.active });
      setRooms((currentRooms) => currentRooms.map((item) => item.id === id ? data.room : item));
      addToast(`${room?.name} ${room?.active ? "dinonaktifkan" : "diaktifkan"}.`, "info");
    } catch (error) {
      addToast(error.message || "Gagal mengubah status ruangan.", "error");
    }
  }, [addToast, rooms]);

  const handleAddDept = useCallback(async (department) => {
    try {
      const head = users.find((user) => user.name === department.head);
      const data = await clientApi.departments.create({
        name: department.name,
        color: department.color,
        description: department.description,
        active: department.active,
        headId: head?.id || null,
      });

      setDepartments((currentDepartments) =>
        currentDepartments.some((d) => d.id === data.department.id)
          ? currentDepartments
          : [...currentDepartments, data.department]
      );
      setModal(null);
      addToast(`✓ Departemen "${data.department.name}" ditambahkan.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal menambah departemen.", "error");
    }
  }, [addToast, users]);

  const handleEditDept = useCallback(async (department) => {
    const previousDepartment = departments.find((item) => item.id === department.id);

    try {
      const head = users.find((user) => user.name === department.head);
      const data = await clientApi.departments.update(department.id, {
        name: department.name,
        color: department.color,
        description: department.description,
        active: department.active,
        headId: head?.id || null,
      });

      setDepartments((currentDepartments) => currentDepartments.map((item) => item.id === department.id ? data.department : item));

      if (previousDepartment?.name && previousDepartment.name !== data.department.name) {
        setUsers((currentUsers) => currentUsers.map((user) => user.department === previousDepartment.name ? { ...user, department: data.department.name, departmentId: data.department.id } : user));
        setBookings((currentBookings) => currentBookings.map((booking) => booking.department === previousDepartment.name ? { ...booking, department: data.department.name, departmentId: data.department.id } : booking));
        setAuthUser((currentUser) => currentUser?.department === previousDepartment.name ? { ...currentUser, department: data.department.name, departmentId: data.department.id } : currentUser);
      }

      setModal(null);
      addToast(`Departemen "${data.department.name}" diperbarui.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal memperbarui departemen.", "error");
    }
  }, [addToast, departments, users]);

  const handleDeleteDept = useCallback(async (department) => {
    try {
      await clientApi.departments.remove(department.id);
      setDepartments((currentDepartments) => currentDepartments.filter((item) => item.id !== department.id));
      setUsers((currentUsers) => currentUsers.map((user) => user.department === department.name ? { ...user, department: null, departmentId: null } : user));
      setBookings((currentBookings) => currentBookings.map((booking) => booking.department === department.name ? { ...booking, department: null, departmentId: null } : booking));
      setAuthUser((currentUser) => currentUser?.department === department.name ? { ...currentUser, department: null, departmentId: null } : currentUser);
      setModal(null);
      addToast(`Departemen "${department.name}" dihapus.`, "error");
    } catch (error) {
      addToast(error.message || "Gagal menghapus departemen.", "error");
    }
  }, [addToast]);

  const handleToggleDept = useCallback(async (id) => {
    const department = departments.find((item) => item.id === id);

    try {
      const data = await clientApi.departments.update(id, { active: !department?.active });
      setDepartments((currentDepartments) => currentDepartments.map((item) => item.id === id ? data.department : item));
      addToast(`${department?.name} ${department?.active ? "dinonaktifkan" : "diaktifkan"}.`, "info");
    } catch (error) {
      addToast(error.message || "Gagal mengubah status departemen.", "error");
    }
  }, [addToast, departments]);

  const handleAddUser = useCallback(async (user) => {
    try {
      const department = departments.find((item) => item.name === user.department);
      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.active,
        avatarColor: user.avatarColor,
        departmentId: department?.id || null,
      };

      if (user.password) {
        payload.password = user.password;
      }

      const data = await clientApi.users.create(payload);
      setUsers((currentUsers) =>
        currentUsers.some((u) => u.id === data.user.id)
          ? currentUsers
          : [...currentUsers, data.user]
      );
      setModal(null);
      addToast(`✓ Pengguna "${data.user.name}" ditambahkan.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal menambah pengguna.", "error");
    }
  }, [addToast, departments]);

  const handleEditUser = useCallback(async (user) => {
    const previousUser = users.find((item) => item.id === user.id);

    try {
      const department = departments.find((item) => item.name === user.department);
      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.active,
        avatarColor: user.avatarColor,
        departmentId: department?.id || null,
      };

      if (user.password) {
        payload.password = user.password;
      }

      const data = await clientApi.users.update(user.id, payload);
      setUsers((currentUsers) => currentUsers.map((item) => item.id === user.id ? data.user : item));

      if (previousUser?.name && previousUser.name !== data.user.name) {
        setBookings((currentBookings) => currentBookings.map((booking) => booking.organizer === previousUser.name ? { ...booking, organizer: data.user.name, organizerId: data.user.id } : booking));
      }

      setAuthUser((currentUser) => currentUser?.id === data.user.id ? data.user : currentUser);
      setModal(null);
      addToast(`Pengguna "${data.user.name}" diperbarui.`, "success");
    } catch (error) {
      addToast(error.message || "Gagal memperbarui pengguna.", "error");
    }
  }, [addToast, departments, users]);

  const handleDeleteUser = useCallback(async (user) => {
    try {
      await clientApi.users.remove(user.id);
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id));
      setBookings((currentBookings) => currentBookings.map((booking) => booking.organizer === user.name ? { ...booking, organizer: null, organizerId: null } : booking));
      setModal(null);
      addToast(`Pengguna "${user.name}" dihapus.`, "error");
    } catch (error) {
      addToast(error.message || "Gagal menghapus pengguna.", "error");
    }
  }, [addToast]);

  const handleToggleUser = useCallback(async (id) => {
    const user = users.find((item) => item.id === id);

    try {
      const data = await clientApi.users.update(id, { active: !user?.active });
      setUsers((currentUsers) => currentUsers.map((item) => item.id === id ? data.user : item));
      setAuthUser((currentUser) => currentUser?.id === data.user.id ? data.user : currentUser);
      addToast(`${user?.name} ${user?.active ? "dinonaktifkan" : "diaktifkan"}.`, "info");
    } catch (error) {
      addToast(error.message || "Gagal mengubah status pengguna.", "error");
    }
  }, [addToast, users]);

  const handleNavClick = useCallback((id) => {
    const isProtected = !PUBLIC_VIEWS.includes(id);
    const isAdmin = authUser?.role === "admin";

    if (isProtected && !authUser) {
      setModal({ type: "loginPrompt" });
      return;
    }

    if (ADMIN_VIEWS.includes(id) && !isAdmin) {
      addToast("Halaman ini hanya untuk Admin.", "error");
      return;
    }

    setView(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [addToast, authUser, isMobile]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  }, []);

  const openSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((currentState) => !currentState);
    }
  }, [isMobile]);

  const activeRooms = useMemo(() => rooms.filter((room) => room.active), [rooms]);
  const isAdmin = authUser?.role === "admin";
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = useMemo(() => (
    bookings.filter((booking) => booking.date === new Date().toISOString().split("T")[0] && booking.status === "confirmed" && timeToMin(booking.startTime) > nowMinutes).length
  ), [bookings, nowMinutes]);

  return {
    state: {
      view,
      rooms,
      departments,
      users,
      bookings,
      modal,
      toasts,
      initializing,
      authUser,
      showLogin,
      layout,
      theme,
      isMobile,
      isTablet,
      sidebarOpen,
      activeRooms,
      isAdmin,
      navItems: NAV_ITEMS,
      upcoming,
    },
    actions: {
      setView,
      setModal,
      setShowLogin,
      setLayout,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      toggleTheme,
      removeToast,
      handleLogin,
      handleLogout,
      handleNavClick,
      requireAuth,
      handleSaveBooking,
      handleCancel,
      handleCheckin,
      handleAddRoom,
      handleEditRoom,
      handleDeleteRoom,
      handleToggleRoom,
      handleAddDept,
      handleEditDept,
      handleDeleteDept,
      handleToggleDept,
      handleAddUser,
      handleEditUser,
      handleDeleteUser,
      handleToggleUser,
    },
  };
}
