export function MeetingAppModals({
  modal,
  authUser,
  rooms,
  activeRooms,
  departments,
  users,
  bookings,
  components,
  actions,
}) {
  const {
    LoginPromptModal,
    BookingModal,
    DetailModal,
    RoomFormModal,
    DeleteConfirmModal,
    DeptFormModal,
    GenericDeleteModal,
    UserFormModal,
  } = components;

  const {
    setModal,
    setShowLogin,
    handleSaveBooking,
    handleCancel,
    handleCheckin,
    handleAddRoom,
    handleEditRoom,
    handleDeleteRoom,
    handleAddDept,
    handleEditDept,
    handleDeleteDept,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
  } = actions;

  return (
    <>
      {modal?.type === "loginPrompt" && (
        <LoginPromptModal
          onGoLogin={() => { setModal(null); setShowLogin(true); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "booking" && authUser && (
        <BookingModal
          rooms={activeRooms}
          bookings={bookings}
          users={users}
          departments={departments}
          preRoom={modal.preRoom}
          preDate={modal.preDate}
          onSave={handleSaveBooking}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "detail" && (() => {
        const booking = modal.booking;
        const room = rooms.find((item) => item.id === booking.roomId);
        return (
          <DetailModal
            booking={bookings.find((item) => item.id === booking.id) || booking}
            room={room}
            onCancel={authUser ? handleCancel : null}
            onCheckin={authUser ? handleCheckin : null}
            onClose={() => setModal(null)}
          />
        );
      })()}
      {modal?.type === "roomAdd" && <RoomFormModal onSave={handleAddRoom} onClose={() => setModal(null)} />}
      {modal?.type === "roomEdit" && <RoomFormModal room={modal.room} onSave={handleEditRoom} onClose={() => setModal(null)} />}
      {modal?.type === "roomDelete" && (() => {
        const room = modal.room;
        const bookingCount = bookings.filter((booking) => booking.roomId === room.id && ["confirmed", "checked_in"].includes(booking.status)).length;
        return <DeleteConfirmModal room={room} bookingCount={bookingCount} onConfirm={() => handleDeleteRoom(room)} onClose={() => setModal(null)} />;
      })()}
      {modal?.type === "deptAdd" && <DeptFormModal users={users} onSave={handleAddDept} onClose={() => setModal(null)} />}
      {modal?.type === "deptEdit" && <DeptFormModal dept={modal.dept} users={users} onSave={handleEditDept} onClose={() => setModal(null)} />}
      {modal?.type === "deptDelete" && (() => {
        const department = modal.dept;
        const memberCount = users.filter((user) => user.department === department.name).length;
        return (
          <GenericDeleteModal
            title="Hapus Departemen?"
            subtitle={`Anda akan menghapus <strong>${department.name}</strong> secara permanen.`}
            warning={memberCount > 0 ? `<strong style="color:#f59e0b">${memberCount} pengguna</strong> di departemen ini tidak akan terpengaruh.` : null}
            onConfirm={() => handleDeleteDept(department)}
            onClose={() => setModal(null)}
          />
        );
      })()}
      {modal?.type === "userAdd" && <UserFormModal departments={departments} onSave={handleAddUser} onClose={() => setModal(null)} />}
      {modal?.type === "userEdit" && <UserFormModal user={modal.user} departments={departments} onSave={handleEditUser} onClose={() => setModal(null)} />}
      {modal?.type === "userDelete" && (() => {
        const user = modal.user;
        const bookingCount = bookings.filter((booking) => booking.organizer === user.name && ["confirmed", "checked_in"].includes(booking.status)).length;
        return (
          <GenericDeleteModal
            title="Hapus Pengguna?"
            subtitle={`Anda akan menghapus akun <strong>${user.name}</strong> secara permanen.`}
            warning={bookingCount > 0 ? `<strong style="color:#f59e0b">${bookingCount} booking aktif</strong> milik pengguna ini tidak otomatis dibatalkan.` : null}
            onConfirm={() => handleDeleteUser(user)}
            onClose={() => setModal(null)}
          />
        );
      })()}
    </>
  );
}
