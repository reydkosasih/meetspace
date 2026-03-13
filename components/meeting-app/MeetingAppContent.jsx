export function MeetingAppContent({
  view,
  authUser,
  rooms,
  activeRooms,
  departments,
  users,
  bookings,
  views,
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

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px", background: "var(--app-bg)", height: "100%", color: "var(--text-primary)", fontFamily: "'DM Sans',sans-serif" }}>
      {view === "calendar" && (
        <CalendarView
          bookings={bookings}
          rooms={activeRooms}
          onNewBooking={(room, date) => onRequireBooking(room, date)}
          onBookingClick={onBookingClick}
        />
      )}
      {view === "availability" && (
        <AvailabilityView
          rooms={activeRooms}
          bookings={bookings}
          onNewBooking={(room, date) => onRequireBooking(room, date)}
        />
      )}
      {view === "mybookings" && authUser && (
        <MyBookingsView
          bookings={bookings}
          rooms={rooms}
          currentUser={authUser.name}
          onBookingClick={onBookingClick}
          onCancel={onCancel}
        />
      )}
      {view === "analytics" && <AnalyticsView bookings={bookings} rooms={rooms} departments={departments} />}
      {view === "rooms" && authUser?.role === "admin" && (
        <RoomsView
          rooms={rooms}
          bookings={bookings}
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
          onAdd={onUserAdd}
          onEdit={onUserEdit}
          onDelete={onUserDelete}
          onToggleActive={onToggleUser}
        />
      )}
    </div>
  );
}
