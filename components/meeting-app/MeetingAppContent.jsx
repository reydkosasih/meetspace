import { LogIn, Menu, Plus } from "lucide-react";

export function MeetingAppContent({
  view,
  authUser,
  rooms,
  activeRooms,
  departments,
  users,
  bookings,
  navItems,
  isMobile,
  isTablet,
  views,
  onOpenSidebar,
  onOpenBooking,
  onOpenLogin,
  onRequireBooking,
  onBookingClick,
  onCancel,
  onRoomAdd,
  onRoomEdit,
  onRoomDelete,
  onToggleRoom,
  onDeptAdd,
  onDeptEdit,
  onDeptDelete,
  onToggleDept,
  onUserAdd,
  onUserEdit,
  onUserDelete,
  onToggleUser,
}) {
  const {
    CalendarView,
    AvailabilityView,
    MyBookingsView,
    AnalyticsView,
    RoomsView,
    DepartmentsView,
    UsersView,
  } = views;
  const activeView = navItems.find((item) => item.id === view);
  const viewMode = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "18px 14px 20px" : isTablet ? "24px 20px 24px" : "32px", background: "var(--app-bg)", height: "100%", color: "var(--text-primary)", fontFamily: "'DM Sans',sans-serif", minWidth: 0 }}>
      {isMobile && (
        <div style={{ position: "sticky", top: 0, zIndex: 30, margin: "-18px -14px 18px", padding: "max(14px, env(safe-area-inset-top)) 14px 14px", background: "var(--panel-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--surface-muted)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onOpenSidebar} aria-label="Buka sidebar" style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid var(--surface-muted)", background: "var(--panel-bg)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Menu size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeView?.label || "MeetSpace"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{authUser ? `Masuk sebagai ${authUser.name.split(" ")[0]}` : "Mode tamu"}</div>
          </div>
          {authUser ? (
            <button onClick={onOpenBooking} style={{ height: 42, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 14px", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
              <Plus size={15} /> Baru
            </button>
          ) : (
            <button onClick={onOpenLogin} style={{ height: 42, borderRadius: 12, border: "1px solid var(--surface-muted)", background: "var(--panel-bg)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 14px", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
              <LogIn size={15} /> Login
            </button>
          )}
        </div>
      )}
      {view === "calendar" && (
        <CalendarView
          bookings={bookings}
          rooms={activeRooms}
          isMobile={isMobile}
          onNewBooking={(room, date) => onRequireBooking(room, date)}
          onBookingClick={onBookingClick}
        />
      )}
      {view === "availability" && (
        <AvailabilityView
          rooms={activeRooms}
          bookings={bookings}
          isMobile={isMobile}
          onNewBooking={(room, date) => onRequireBooking(room, date)}
        />
      )}
      {view === "mybookings" && authUser && (
        <MyBookingsView
          bookings={bookings}
          rooms={rooms}
          currentUser={authUser.name}
          isMobile={isMobile}
          onBookingClick={onBookingClick}
          onCancel={onCancel}
        />
      )}
      {view === "analytics" && <AnalyticsView bookings={bookings} rooms={rooms} departments={departments} isMobile={isMobile} />}
      {view === "rooms" && authUser?.role === "admin" && (
        <RoomsView
          rooms={rooms}
          bookings={bookings}
          viewMode={viewMode}
          onAdd={onRoomAdd}
          onEdit={onRoomEdit}
          onDelete={onRoomDelete}
          onToggleActive={onToggleRoom}
        />
      )}
      {view === "departments" && authUser?.role === "admin" && (
        <DepartmentsView
          departments={departments}
          users={users}
          bookings={bookings}
          viewMode={viewMode}
          onAdd={onDeptAdd}
          onEdit={onDeptEdit}
          onDelete={onDeptDelete}
          onToggleActive={onToggleDept}
        />
      )}
      {view === "users" && authUser?.role === "admin" && (
        <UsersView
          users={users}
          departments={departments}
          bookings={bookings}
          viewMode={viewMode}
          onAdd={onUserAdd}
          onEdit={onUserEdit}
          onDelete={onUserDelete}
          onToggleActive={onToggleUser}
        />
      )}
    </div>
  );
}
