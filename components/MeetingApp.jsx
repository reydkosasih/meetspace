import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  Calendar, Clock, Users, MapPin, CheckCircle, XCircle, QrCode, BarChart2,
  Bell, Search, Filter, Plus, ChevronLeft, ChevronRight, AlertCircle,
  Coffee, Wifi, Monitor, Mic, Video, LogOut, Home, Layers, TrendingUp,
  Check, X, RefreshCw, Building2, Zap, Star, Settings, Pencil, Trash2,
  ToggleLeft, ToggleRight, Hash, Palette, Info, Briefcase, UserPlus,
  Mail, Phone, Shield, UserCheck, UserX, Tag, Globe, Crown, Eye,
  Lock, EyeOff, KeyRound, LayoutPanelLeft, Maximize2, LogIn, UserCircle2, ShieldAlert
} from "lucide-react";
import { AppSidebar } from "@/components/meeting-app/AppSidebar";
import { APP_THEME_STYLE } from "@/components/meeting-app/constants";
import { LayoutWrapper } from "@/components/meeting-app/LayoutWrapper";
import { LoadingScreen } from "@/components/meeting-app/LoadingScreen";
import { MeetingAppContent } from "@/components/meeting-app/MeetingAppContent";
import { MeetingAppModals } from "@/components/meeting-app/MeetingAppModals";
import { useMeetingAppController } from "@/hooks/useMeetingAppController";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeToMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const minToTime = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const BUFFER = 10;

function hasConflict(bookings, roomId, date, startTime, endTime, excludeId = null) {
  const s = timeToMin(startTime);
  const e = timeToMin(endTime);
  return bookings
    .filter(b => b.roomId === roomId && b.date === date && b.id !== excludeId && b.status !== "cancelled" && b.status !== "no_show")
    .some(b => {
      const bs = timeToMin(b.startTime) - BUFFER;
      const be = timeToMin(b.endTime) + BUFFER;
      return s < be && e > bs;
    });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const days = getDaysInMonth(year, month);
  const matrix = [];
  let week = Array(firstDay).fill(null);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { matrix.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); matrix.push(week); }
  return matrix;
}

const AMENITY_ICONS = { projector: Monitor, tv: Monitor, video: Video, wifi: Wifi, whiteboard: Layers, coffee: Coffee, mic: Mic };
const STATUS_CFG = {
  confirmed: { label: "Confirmed", color: "var(--success)", bg: "var(--success-bg)" },
  checked_in: { label: "Active", color: "var(--warning)", bg: "var(--warning-bg)" },
  completed: { label: "Done", color: "var(--text-muted)", bg: "var(--surface-muted)" },
  cancelled: { label: "Cancelled", color: "var(--danger)", bg: "var(--danger-bg)" },
  no_show: { label: "No Show", color: "var(--warning)", bg: "var(--warning-bg)" },
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "success" ? "var(--success-bg)" : t.type === "error" ? "var(--danger-bg)" : "var(--info-bg)",
          border: `1px solid ${t.type === "success" ? "var(--success)" : t.type === "error" ? "var(--danger)" : "var(--info)"}`,
          borderRadius: 12, padding: "14px 18px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12,
          minWidth: 300, maxWidth: 400, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          animation: "slideIn .3s ease",
          boxShadow: "0 8px 32px rgba(0,0,0,.6)"
        }}>
          {t.type === "success" ? <CheckCircle size={18} color="var(--success)" /> : t.type === "error" ? <XCircle size={18} color="var(--danger)" /> : <Bell size={18} color="var(--info)" />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 20,
        width: "100%", maxWidth: wide ? 760 : 520, maxHeight: "90vh", overflowY: "auto",
        padding: 32, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 24px 80px rgba(0,0,0,.8)"
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── QR MODAL ─────────────────────────────────────────────────────────────────
function QRModal({ booking, room, onCheckin, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const simulate = () => {
    setScanning(true);
    setTimeout(() => { setDone(true); setTimeout(() => { onCheckin(booking.id); onClose(); }, 1000); }, 1800);
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, background: room.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <QrCode size={24} color={room.color} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>QR Check-in</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>{room.name} · {booking.startTime}–{booking.endTime}</p>

        {/* Fake QR grid */}
        <div style={{ width: 180, height: 180, margin: "0 auto 20px", position: "relative" }}>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", opacity: done ? 0.3 : scanning ? 0.6 : 1, transition: "opacity .4s" }}>
            {/* QR border squares */}
            <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke={room.color} strokeWidth="3" />
            <rect x="10" y="10" width="15" height="15" rx="1" fill={room.color} />
            <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke={room.color} strokeWidth="3" />
            <rect x="75" y="10" width="15" height="15" rx="1" fill={room.color} />
            <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke={room.color} strokeWidth="3" />
            <rect x="10" y="75" width="15" height="15" rx="1" fill={room.color} />
            {/* dots */}
            {[35, 40, 45, 50, 55, 60, 65].map(x => [35, 40, 45, 50, 55, 60, 65].map(y => Math.random() > 0.5 && (
              <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={room.color} opacity={0.7} />
            )))}
          </svg>
          {done && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={64} color="#10b981" />
            </div>
          )}
          {scanning && !done && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: room.color, borderRadius: 2, animation: "scan 1.8s linear" }} />
          )}
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Kode: <span style={{ fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 700, letterSpacing: 2 }}>{booking.checkinCode}</span></p>
        {!done && !scanning && (
          <button onClick={simulate} style={{
            background: room.color, color: "#000", border: "none", borderRadius: 10,
            padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: 15, width: "100%"
          }}>Simulasi Scan QR Code</button>
        )}
        {scanning && !done && <p style={{ color: room.color, fontWeight: 600 }}>Memverifikasi...</p>}
        {done && <p style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>✓ Check-in Berhasil!</p>}
      </div>
    </Modal>
  );
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
function BookingModal({ rooms, bookings, preRoom, preDate, users, departments, onSave, onClose }) {
  const activeUsers = users.filter(u => u.active);
  const activeDepts = departments.filter(d => d.active);
  const hasBookingPrereqs = rooms.length > 0 && activeUsers.length > 0 && activeDepts.length > 0;
  const [form, setForm] = useState({
    roomId: preRoom?.id || rooms[0]?.id || "",
    title: "",
    date: preDate || todayStr,
    startTime: "09:00",
    endTime: "10:00",
    organizer: activeUsers[0]?.name || "",
    department: activeDepts[0]?.name || "",
    attendees: 5,
  });
  const [error, setError] = useState("");
  const room = rooms.find(r => r.id === Number(form.roomId)) || null;
  const bufferEnd = minToTime(timeToMin(form.endTime) + BUFFER);

  useEffect(() => {
    setForm(currentForm => ({
      ...currentForm,
      roomId: currentForm.roomId || preRoom?.id || rooms[0]?.id || "",
      organizer: currentForm.organizer || activeUsers[0]?.name || "",
      department: currentForm.department || activeDepts[0]?.name || "",
    }));
  }, [preRoom, rooms, activeUsers, activeDepts]);

  const submit = () => {
    if (!hasBookingPrereqs || !room) return setError("Booking belum bisa dibuat. Pastikan ada room, user aktif, dan departemen aktif.");
    if (!form.title.trim()) return setError("Judul meeting wajib diisi.");
    if (timeToMin(form.startTime) >= timeToMin(form.endTime)) return setError("Waktu selesai harus setelah waktu mulai.");
    if (form.attendees > room.capacity) return setError(`Kapasitas ${room.name} hanya ${room.capacity} orang.`);
    if (hasConflict(bookings, Number(form.roomId), form.date, form.startTime, form.endTime))
      return setError(`Slot ini bertabrakan dengan booking lain (termasuk buffer ${BUFFER} menit).`);
    setError("");
    onSave({
      ...form, roomId: Number(form.roomId), attendees: Number(form.attendees),
      id: Date.now(), status: "confirmed",
      checkinCode: `MR${String(Date.now()).slice(-4)}`,
    });
  };

  const inp = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const inputStyle = {
    background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10,
    color: "var(--text-primary)", padding: "10px 14px", width: "100%", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box"
  };
  const labelStyle = { fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Booking Ruang Meeting</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Buffer otomatis {BUFFER} menit akan ditambahkan setelah meeting berakhir</p>
        </div>
        <button onClick={onClose} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} />
        </button>
      </div>

      {!hasBookingPrereqs && (
        <div style={{ marginBottom: 16, background: "var(--warning-bg)", border: "1px solid var(--warning-soft)", borderRadius: 10, padding: "12px 16px", color: "var(--warning)", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <AlertCircle size={16} /> Booking memerlukan minimal satu room aktif, satu user aktif, dan satu departemen aktif.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Title */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Judul Meeting *</label>
          <input style={inputStyle} placeholder="Contoh: Sprint Planning Q3" value={form.title} onChange={e => inp("title", e.target.value)} />
        </div>

        {/* Room */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Pilih Ruangan</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {rooms.map(r => (
              <div key={r.id} onClick={() => inp("roomId", r.id)} style={{
                border: `2px solid ${form.roomId == r.id ? r.color : "var(--border-color)"}`,
                borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                background: form.roomId == r.id ? r.color + "15" : "var(--surface-bg)",
                transition: "all .2s"
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.capacity} orang · {r.floor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>Tanggal</label>
          <input type="date" style={inputStyle} value={form.date} min={todayStr} onChange={e => inp("date", e.target.value)} />
        </div>

        {/* Attendees */}
        <div>
          <label style={labelStyle}>Jumlah Peserta (maks. {room?.capacity || 0})</label>
          <input type="number" style={inputStyle} value={form.attendees} min={1} max={room?.capacity || 1} onChange={e => inp("attendees", e.target.value)} />
        </div>

        {/* Time */}
        <div>
          <label style={labelStyle}>Jam Mulai</label>
          <input type="time" style={inputStyle} value={form.startTime} onChange={e => inp("startTime", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Jam Selesai <span style={{ color: room?.color || "var(--text-secondary)" }}>+buffer {BUFFER}m → {bufferEnd}</span></label>
          <input type="time" style={inputStyle} value={form.endTime} onChange={e => inp("endTime", e.target.value)} />
        </div>

        {/* Organizer */}
        <div>
          <label style={labelStyle}>Penyelenggara</label>
          <select style={inputStyle} value={form.organizer} onChange={e => inp("organizer", e.target.value)}>
            {activeUsers.map(u => <option key={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Dept */}
        <div>
          <label style={labelStyle}>Departemen</label>
          <select style={inputStyle} value={form.department} onChange={e => inp("department", e.target.value)}>
            {activeDepts.map(d => <option key={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "12px 16px", color: "var(--danger)", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Batal</button>
        <button onClick={submit} disabled={!hasBookingPrereqs || !room} style={{ flex: 2, background: room?.color || "var(--text-disabled)", border: "none", color: "#000", borderRadius: 10, padding: "13px", cursor: !hasBookingPrereqs || !room ? "not-allowed" : "pointer", opacity: !hasBookingPrereqs || !room ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }}>Konfirmasi Booking →</button>
      </div>
    </Modal>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ booking, room, onCancel, onCheckin, onClose }) {
  const [showQR, setShowQR] = useState(false);
  if (showQR) return <QRModal booking={booking} room={room} onCheckin={onCheckin} onClose={onClose} />;
  const sc = STATUS_CFG[booking.status] || STATUS_CFG.confirmed;
  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, background: room.color + "22", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Building2 size={26} color={room.color} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{booking.title}</h2>
          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {[
          [MapPin, "Ruangan", `${room.name} · ${room.floor}`],
          [Calendar, "Tanggal", new Date(booking.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
          [Clock, "Waktu", `${booking.startTime} – ${booking.endTime} (buffer +${BUFFER}m)`],
          [Users, "Peserta", `${booking.attendees} orang · Kapasitas ${room.capacity}`],
          [Building2, "Departemen", `${booking.department}`],
        ].map(([Icon, label, val]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-bg)", borderRadius: 10, padding: "12px 16px" }}>
            <Icon size={16} color={room.color} />
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {booking.status === "confirmed" && (
          <>
            <button onClick={() => setShowQR(true)} style={{ flex: 1, background: room.color, border: "none", color: "#000", borderRadius: 10, padding: "12px", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <QrCode size={16} /> Check-in QR
            </button>
            <button onClick={() => onCancel(booking.id)} style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", color: "var(--danger)", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontSize: 14 }}>
              <X size={16} />
            </button>
          </>
        )}
        {booking.status !== "confirmed" && (
          <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "12px", cursor: "pointer" }}>Tutup</button>
        )}
      </div>
    </Modal>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ bookings, rooms, onNewBooking, onBookingClick }) {
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterCap, setFilterCap] = useState(0);
  const [search, setSearch] = useState("");

  const matrix = getMonthMatrix(year, month);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const getDayBookings = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter(b => b.date === dateStr && b.status !== "cancelled");
  };

  const selectedBookings = bookings.filter(b => {
    if (b.date !== selectedDate || b.status === "cancelled") return false;
    const room = rooms.find(r => r.id === b.roomId);
    if (filterCap && room?.capacity < filterCap) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.organizer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selDateObj = new Date(selectedDate + "T00:00:00");
  const selFormatted = selDateObj.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, height: "100%" }}>
      {/* Calendar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button onClick={prevMonth} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-primary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={16} /></button>
          <h2 style={{ fontSize: 22, fontWeight: 700, flex: 1 }}>{monthNames[month]} {year}</h2>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(todayStr); }} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Hari ini</button>
          <button onClick={nextMonth} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-primary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={16} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", fontWeight: 600, padding: "8px 0", textTransform: "uppercase", letterSpacing: 0.8 }}>{d}</div>
          ))}
        </div>

        {matrix.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>
            {week.map((day, di) => {
              const ds = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayBkgs = day ? getDayBookings(day) : [];
              const isToday = ds === todayStr;
              const isSel = ds === selectedDate;
              const isPast = ds && ds < todayStr;
              return (
                <div key={di} onClick={() => day && setSelectedDate(ds)} style={{
                  borderRadius: 10, padding: "8px 6px", minHeight: 72, cursor: day ? "pointer" : "default",
                  background: isSel ? "var(--calendar-selected-bg)" : isToday ? "var(--calendar-today-bg)" : "var(--panel-elevated)",
                  border: `1px solid ${isSel ? "var(--info)" : isToday ? "var(--calendar-today-border)" : "var(--surface-muted)"}`,
                  transition: "all .15s", opacity: isPast && !isSel ? 0.5 : 1
                }}>
                  {day && (
                    <>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px",
                        background: isToday ? "var(--info)" : "transparent",
                        color: isToday ? "#fff" : isSel ? "var(--calendar-selected-text)" : "var(--calendar-day-text)",
                        fontWeight: isToday || isSel ? 700 : 400, fontSize: 14
                      }}>{day}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                        {dayBkgs.slice(0, 3).map(b => {
                          const r = rooms.find(x => x.id === b.roomId);
                          return <div key={b.id} style={{ width: 8, height: 8, borderRadius: "50%", background: r?.color || "#6366f1" }} />;
                        })}
                        {dayBkgs.length > 3 && <div style={{ fontSize: 9, color: "var(--text-muted)" }}>+{dayBkgs.length - 3}</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Room Legend */}
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {rooms.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
              {r.name}
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selFormatted}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{selectedBookings.length} jadwal aktif</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} style={{
              width: "100%", boxSizing: "border-box", background: "var(--surface-bg)", border: "1px solid var(--surface-muted)",
              borderRadius: 8, color: "var(--text-primary)", padding: "8px 10px 8px 30px", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", outline: "none"
            }} />
          </div>
          <select value={filterCap} onChange={e => setFilterCap(Number(e.target.value))} style={{
            background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 8,
            color: filterCap ? "var(--text-primary)" : "var(--text-muted)", padding: "8px 10px", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none"
          }}>
            <option value={0}>Semua</option>
            <option value={4}>≥4 org</option>
            <option value={8}>≥8 org</option>
            <option value={12}>≥12 org</option>
            <option value={20}>≥20 org</option>
          </select>
        </div>

        <button onClick={() => onNewBooking(null, selectedDate)} style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff",
          borderRadius: 12, padding: "13px", cursor: "pointer", fontWeight: 700, fontSize: 15,
          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Plus size={18} /> Booking Baru
        </button>

        {/* Bookings list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {selectedBookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Tidak ada jadwal</p>
            </div>
          ) : selectedBookings.map(b => {
            const room = rooms.find(r => r.id === b.roomId);
            const sc = STATUS_CFG[b.status] || STATUS_CFG.confirmed;
            return (
              <div key={b.id} onClick={() => onBookingClick(b)} style={{
                background: "var(--panel-elevated)", border: `1px solid ${room?.color}33`,
                borderLeft: `3px solid ${room?.color}`, borderRadius: 12, padding: "14px",
                cursor: "pointer", transition: "all .15s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                  <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{sc.label}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{b.startTime}–{b.endTime}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{room?.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} />{b.attendees}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AVAILABILITY VIEW ────────────────────────────────────────────────────────
function AvailabilityView({ rooms, bookings, onNewBooking }) {
  const [viewDate, setViewDate] = useState(todayStr);
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08–18
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = viewDate === todayStr;

  const getRoomBookingsForDay = (roomId) =>
    bookings.filter(b => b.roomId === roomId && b.date === viewDate && b.status !== "cancelled");

  const isSlotBusy = (roomId, hour) => {
    const slotStart = hour * 60;
    const slotEnd = slotStart + 60;
    return getRoomBookingsForDay(roomId).some(b => {
      const bs = timeToMin(b.startTime) - BUFFER;
      const be = timeToMin(b.endTime) + BUFFER;
      return slotStart < be && slotEnd > bs;
    });
  };

  const getBookingAtSlot = (roomId, hour) => {
    const slotStart = hour * 60;
    return getRoomBookingsForDay(roomId).find(b => {
      const bs = timeToMin(b.startTime);
      const be = timeToMin(b.endTime);
      return slotStart >= bs && slotStart < be;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, flex: 1 }}>Ketersediaan Ruangan</h2>
        <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{
          background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)",
          padding: "8px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none"
        }} />
        <button onClick={() => onNewBooking()} style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff",
          borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8
        }}>
          <Plus size={16} /> Booking
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        {[["var(--success)", "Tersedia"], ["var(--danger)", "Terpakai"], ["var(--warning)", "Buffer"], ["var(--info)", "Sekarang"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: c }} />{l}
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 700 }}>
          {/* Hour headers */}
          <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${hours.length}, 1fr)`, gap: 2, marginBottom: 4 }}>
            <div />
            {hours.map(h => (
              <div key={h} style={{
                textAlign: "center", fontSize: 12, color: isToday && h === now.getHours() ? "var(--info)" : "var(--text-muted)",
                fontWeight: isToday && h === now.getHours() ? 700 : 400, padding: "4px 0"
              }}>{String(h).padStart(2, "0")}:00</div>
            ))}
          </div>

          {rooms.map(room => {
            const dayBkgs = getRoomBookingsForDay(room.id);
            const busyCount = hours.filter(h => isSlotBusy(room.id, h)).length;
            const pct = Math.round((busyCount / hours.length) * 100);
            return (
              <div key={room.id} style={{ display: "grid", gridTemplateColumns: `180px repeat(${hours.length}, 1fr)`, gap: 2, marginBottom: 4 }}>
                {/* Room label */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: room.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{room.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{room.capacity} org · {pct}% terpakai</div>
                  </div>
                </div>

                {hours.map(h => {
                  const busy = isSlotBusy(room.id, h);
                  const bkg = getBookingAtSlot(room.id, h);
                  const isCurrent = isToday && h === now.getHours();
                  const isBuffer = !bkg && dayBkgs.some(b => {
                    const bufStart = timeToMin(b.endTime);
                    const bufEnd = bufStart + BUFFER;
                    return h * 60 >= bufStart && h * 60 < bufEnd;
                  });

                  let bg = "var(--timeline-slot-bg)";
                  if (isCurrent && !busy) bg = "var(--timeline-current-bg)";
                  if (isBuffer) bg = "var(--timeline-buffer-bg)";
                  if (busy) bg = room.color + "33";

                  return (
                    <div key={h} style={{
                      height: 52, borderRadius: 6, background: bg,
                      border: `1px solid ${busy ? room.color + "55" : isCurrent ? "var(--info)" : "var(--surface-muted)"}`,
                      cursor: !busy ? "pointer" : "default",
                      position: "relative", overflow: "hidden", transition: "all .15s"
                    }} onClick={() => !busy && onNewBooking(room, viewDate)}>
                      {isCurrent && !busy && (
                        <div style={{ position: "absolute", left: `${(nowMin % 60) / 60 * 100}%`, top: 0, bottom: 0, width: 2, background: "var(--info)" }} />
                      )}
                      {bkg && (
                        <div style={{ fontSize: 9, padding: "4px 6px", color: room.color, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {bkg.title}
                        </div>
                      )}
                      {isBuffer && (
                        <div style={{ fontSize: 9, padding: "4px 6px", color: "var(--warning)", opacity: 0.7 }}>buffer</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Room Cards */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Status Ruangan Saat Ini</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {rooms.map(room => {
            const nowBkg = bookings.find(b =>
              b.roomId === room.id && b.date === todayStr && b.status !== "cancelled" &&
              timeToMin(b.startTime) <= nowMin && timeToMin(b.endTime) > nowMin
            );
            const nextBkg = bookings.filter(b =>
              b.roomId === room.id && b.date === todayStr && b.status !== "cancelled" &&
              timeToMin(b.startTime) > nowMin
            ).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
            const isFree = !nowBkg;

            return (
              <div key={room.id} style={{
                background: "var(--panel-bg)", border: `1px solid ${isFree ? "var(--success-soft)" : room.color + "44"}`,
                borderRadius: 16, padding: "20px", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: isFree ? "var(--success)" : room.color }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{room.name}</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{room.floor} · {room.capacity} orang</p>
                  </div>
                  <span style={{
                    background: isFree ? "var(--success-bg)" : "var(--danger-bg)",
                    color: isFree ? "var(--success)" : "var(--danger)",
                    borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700
                  }}>{isFree ? "Kosong" : "Terpakai"}</span>
                </div>

                {nowBkg ? (
                  <div style={{ background: "var(--surface-bg)", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{nowBkg.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{nowBkg.organizer} · Selesai {nowBkg.endTime}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--success)", marginBottom: 10 }}>● Siap digunakan</div>
                )}

                {nextBkg && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Berikutnya: {nextBkg.title} pukul {nextBkg.startTime}</div>
                )}

                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  {room.amenities.map(a => {
                    const Icon = AMENITY_ICONS[a];
                    return Icon ? (
                      <div key={a} style={{ background: "var(--surface-bg)", borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon size={11} color={room.color} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{a}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS VIEW ───────────────────────────────────────────────────────────
function AnalyticsView({ bookings, rooms, departments }) {
  const roomUsage = rooms.map(r => ({
    name: r.name.split(" ")[0],
    bookings: bookings.filter(b => b.roomId === r.id && b.status !== "cancelled").length,
    hours: bookings.filter(b => b.roomId === r.id && b.status !== "cancelled")
      .reduce((s, b) => s + (timeToMin(b.endTime) - timeToMin(b.startTime)) / 60, 0).toFixed(1),
    color: r.color,
  }));

  const deptUsage = departments.map(d => ({
    name: d.name, value: bookings.filter(b => b.department === d.name && b.status !== "cancelled").length
  })).sort((a, b) => b.value - a.value);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - 6 + i);
    const ds = d.toISOString().split("T")[0];
    return {
      day: d.toLocaleDateString("id-ID", { weekday: "short" }),
      bookings: bookings.filter(b => b.date === ds && b.status !== "cancelled").length,
    };
  });

  const totalConfirmed = bookings.filter(b => b.status === "confirmed" || b.status === "checked_in").length;
  const totalNoShow = bookings.filter(b => b.status === "no_show").length;
  const totalCancelled = bookings.filter(b => b.status === "cancelled").length;
  const checkinRate = bookings.filter(b => b.status === "checked_in" || b.status === "completed").length;
  const totalDone = bookings.filter(b => ["confirmed", "checked_in", "completed", "no_show"].includes(b.status)).length;

  const statCard = (icon, label, val, sub, color) => (
    <div style={{ background: "var(--panel-bg)", border: `1px solid ${color}33`, borderRadius: 16, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, background: color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <TrendingUp size={14} color={color} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard Analytics</h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {statCard(<BarChart2 size={20} color="#6366f1" />, "Total Booking", bookings.filter(b => b.status !== "cancelled").length, "Semua waktu", "#6366f1")}
        {statCard(<CheckCircle size={20} color="#10b981" />, "Check-in Rate", `${totalDone ? Math.round(checkinRate / totalDone * 100) : 0}%`, `${checkinRate} dari ${totalDone} booking`, "#10b981")}
        {statCard(<AlertCircle size={20} color="#f97316" />, "No Show", totalNoShow, "Booking tapi tidak hadir", "#f97316")}
        {statCard(<XCircle size={20} color="#ef4444" />, "Dibatalkan", totalCancelled, "Booking yang dikancell", "#ef4444")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Weekly trend */}
        <div style={{ background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 16, padding: "20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Tren 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-muted)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)" }} />
              <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dept usage */}
        <div style={{ background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 16, padding: "20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Booking per Departemen</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptUsage.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-muted)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)" }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Room usage */}
        <div style={{ background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 16, padding: "20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Penggunaan per Ruangan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roomUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-muted)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)" }} />
              <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                {roomUsage.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie status */}
        <div style={{ background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 16, padding: "20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Distribusi Status Booking</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={[
                  { name: "Confirmed", value: totalConfirmed },
                  { name: "No Show", value: totalNoShow },
                  { name: "Cancelled", value: totalCancelled },
                  { name: "Completed", value: bookings.filter(b => b.status === "completed").length },
                ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {["#6366f1", "#f97316", "#ef4444", "#10b981"].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["#6366f1", "Confirmed", totalConfirmed], ["#f97316", "No Show", totalNoShow], ["#ef4444", "Cancelled", totalCancelled], ["#10b981", "Completed", bookings.filter(b => b.status === "completed").length]].map(([c, l, v]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MY BOOKINGS VIEW ─────────────────────────────────────────────────────────
function MyBookingsView({ bookings, rooms, currentUser, onBookingClick, onCancel }) {
  const myBookings = bookings
    .filter(b => b.organizer === currentUser)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <h2 style={{fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Booking Saya</h2>
      {myBookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <Calendar size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <p>Belum ada booking</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myBookings.map(b => {
            const room = rooms.find(r => r.id === b.roomId);
            const sc = STATUS_CFG[b.status] || STATUS_CFG.confirmed;
            const isUpcoming = b.date >= todayStr;
            return (
              <div key={b.id} onClick={() => onBookingClick(b)} style={{
                background: "var(--panel-bg)", border: `1px solid ${room?.color}33`,
                borderLeft: `4px solid ${room?.color}`, borderRadius: 14, padding: "18px 20px",
                cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{b.title}</span>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} />{new Date(b.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} />{b.startTime} – {b.endTime}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} />{room?.name} · {room?.floor}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={13} />{b.attendees} peserta</span>
                  </div>
                </div>
                {isUpcoming && b.status === "confirmed" && (
                  <button onClick={e => { e.stopPropagation(); onCancel(b.id); }} style={{
                    background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", color: "var(--danger)",
                    borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6
                  }}>
                    <X size={14} /> Batalkan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ROOM FORM MODAL ──────────────────────────────────────────────────────────
const ALL_AMENITIES = ["projector", "tv", "video", "whiteboard", "wifi", "coffee", "mic"];
const FLOOR_OPTIONS = ["1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F", "Basement", "Rooftop"];
const PRESET_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#f97316", "#14b8a6", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#e879f9", "#fb923c"];

function RoomFormModal({ room, onSave, onClose }) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    name: room?.name || "",
    capacity: room?.capacity || 10,
    floor: room?.floor || "3F",
    color: room?.color || "#6366f1",
    description: room?.description || "",
    amenities: room?.amenities ? [...room.amenities] : [],
    active: room?.active !== undefined ? room.active : true,
  });
  const [error, setError] = useState("");
  const inp = (f, v) => setForm(x => ({ ...x, [f]: v }));
  const toggleAmenity = (a) => setForm(x => ({
    ...x,
    amenities: x.amenities.includes(a) ? x.amenities.filter(i => i !== a) : [...x.amenities, a]
  }));

  const submit = () => {
    if (!form.name.trim()) return setError("Nama ruangan wajib diisi.");
    if (form.capacity < 1 || form.capacity > 500) return setError("Kapasitas harus antara 1–500.");
    setError("");
    onSave({ ...form, capacity: Number(form.capacity), id: room?.id || Date.now() });
  };

  const inputStyle = {
    background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10,
    color: "var(--text-primary)", padding: "10px 14px", width: "100%", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box"
  };
  const labelStyle = { fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 };

  return (
    <Modal onClose={onClose} wide>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: form.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color={form.color} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Ruangan" : "Tambah Ruangan Baru"}</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{isEdit ? `Perbarui data untuk ${room.name}` : "Isi detail ruangan meeting baru"}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Name */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Nama Ruangan *</label>
          <input style={inputStyle} placeholder="Contoh: Boardroom Alpha" value={form.name} onChange={e => inp("name", e.target.value)} />
        </div>

        {/* Capacity */}
        <div>
          <label style={labelStyle}>Kapasitas (orang)</label>
          <input type="number" style={inputStyle} value={form.capacity} min={1} max={500} onChange={e => inp("capacity", e.target.value)} />
        </div>

        {/* Floor */}
        <div>
          <label style={labelStyle}>Lantai</label>
          <select style={inputStyle} value={form.floor} onChange={e => inp("floor", e.target.value)}>
            {FLOOR_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        {/* Description */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Deskripsi</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} placeholder="Deskripsikan fasilitas utama atau keunggulan ruangan..." value={form.description} onChange={e => inp("description", e.target.value)} />
        </div>

        {/* Color picker */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Warna Label</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => inp("color", c)} style={{
                width: 32, height: 32, borderRadius: 8, background: c, border: `3px solid ${form.color === c ? "#fff" : "transparent"}`,
                cursor: "pointer", transition: "transform .15s, border .15s",
                transform: form.color === c ? "scale(1.15)" : "scale(1)"
              }} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Custom:</span>
              <input type="color" value={form.color} onChange={e => inp("color", e.target.value)} style={{ width: 36, height: 32, borderRadius: 6, border: "1px solid var(--surface-muted)", background: "var(--surface-bg)", cursor: "pointer" }} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Fasilitas</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ALL_AMENITIES.map(a => {
              const Icon = AMENITY_ICONS[a];
              const selected = form.amenities.includes(a);
              return (
                <button key={a} onClick={() => toggleAmenity(a)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, border: `1px solid ${selected ? form.color : "var(--border-color)"}`,
                  background: selected ? form.color + "22" : "var(--surface-bg)",
                  color: selected ? form.color : "var(--text-muted)", cursor: "pointer",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: selected ? 600 : 400,
                  transition: "all .15s"
                }}>
                  {Icon && <Icon size={13} />} {a}
                  {selected && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active toggle */}
        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-bg)", borderRadius: 12, padding: "14px 18px" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Status Ruangan</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ruangan tidak aktif tidak bisa di-booking</div>
          </div>
          <button onClick={() => inp("active", !form.active)} style={{
            background: form.active ? form.color : "var(--text-disabled)", border: "none", borderRadius: 20,
            width: 52, height: 28, cursor: "pointer", position: "relative", transition: "background .2s"
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3, left: form.active ? 27 : 3, transition: "left .2s"
            }} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "12px 16px", color: "var(--danger)", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Preview */}
      <div style={{ marginTop: 20, background: "var(--panel-elevated)", border: `1px solid ${form.color}44`, borderLeft: `4px solid ${form.color}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Preview Kartu</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{form.name || "Nama Ruangan"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{form.floor} · {form.capacity} orang · {form.amenities.length} fasilitas</div>
          </div>
          <span style={{ background: form.active ? "var(--success-bg)" : "var(--surface-muted)", color: form.active ? "var(--success)" : "var(--text-muted)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {form.active ? "Aktif" : "Nonaktif"}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Batal</button>
        <button onClick={submit} style={{ flex: 2, background: form.color, border: "none", color: "#000", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }}>
          {isEdit ? "Simpan Perubahan" : "Tambah Ruangan"} →
        </button>
      </div>
    </Modal>
  );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteConfirmModal({ room, bookingCount, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "var(--danger-bg)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Trash2 size={26} color="var(--danger)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Hapus Ruangan?</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
          Anda akan menghapus <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{room.name}</span> secara permanen.
        </p>
        {bookingCount > 0 && (
          <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning-soft)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "var(--warning)", fontWeight: 700 }}>{bookingCount} booking aktif</span>
              <span style={{ color: "var(--text-secondary)" }}> di ruangan ini akan ikut dibatalkan.</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Batal</button>
          <button onClick={onConfirm} style={{ flex: 1, background: "var(--danger)", border: "none", color: "#fff", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Hapus Sekarang</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── ROOMS MANAGEMENT VIEW ────────────────────────────────────────────────────
function RoomsView({ rooms, bookings, onAdd, onEdit, onDelete, onToggleActive }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filtered = rooms
    .filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.floor.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? r.active : !r.active);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "capacity") return b.capacity - a.capacity;
      if (sortBy === "floor") return a.floor.localeCompare(b.floor);
      return 0;
    });

  const getRoomStats = (roomId) => {
    const roomBookings = bookings.filter(b => b.roomId === roomId && b.status !== "cancelled");
    const activeToday = bookings.filter(b => b.roomId === roomId && b.date === todayStr && b.status !== "cancelled").length;
    return { total: roomBookings.length, today: activeToday };
  };

  const inputStyle = {
    background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10,
    color: "var(--text-primary)", padding: "9px 14px", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none"
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Kelola Ruangan</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>{rooms.filter(r => r.active).length} aktif</span>
            {" · "}
            <span style={{ color: "var(--text-muted)" }}>{rooms.filter(r => !r.active).length} nonaktif</span>
            {" · "}
            {rooms.length} total ruangan
          </p>
        </div>
        <button onClick={onAdd} style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff",
          borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8
        }}>
          <Plus size={17} /> Tambah Ruangan
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          [Building2, "Total Ruangan", rooms.length, "#6366f1"],
          [CheckCircle, "Aktif", rooms.filter(r => r.active).length, "#10b981"],
          [Users, "Total Kapasitas", rooms.filter(r => r.active).reduce((s, r) => s + r.capacity, 0) + " orang", "#f59e0b"],
          [BarChart2, "Booking Hari Ini", bookings.filter(b => b.date === todayStr && b.status !== "cancelled").length, "#ec4899"],
        ].map(([Icon, label, val, color]) => (
          <div key={label} style={{ background: "var(--panel-bg)", border: `1px solid ${color}22`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input placeholder="Cari nama atau lantai..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="name">Urutkan: Nama</option>
          <option value="capacity">Urutkan: Kapasitas</option>
          <option value="floor">Urutkan: Lantai</option>
        </select>
      </div>

      {/* Room Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p>Tidak ada ruangan ditemukan</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 2fr 1fr 1fr auto", gap: 12, padding: "8px 18px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>
            <span>Ruangan</span>
            <span>Lantai</span>
            <span>Kapasitas</span>
            <span>Fasilitas</span>
            <span>Booking</span>
            <span>Status</span>
            <span>Aksi</span>
          </div>

          {filtered.map(room => {
            const stats = getRoomStats(room.id);
            return (
              <div key={room.id} style={{
                display: "grid", gridTemplateColumns: "3fr 1fr 1fr 2fr 1fr 1fr auto",
                gap: 12, padding: "16px 18px", alignItems: "center",
                background: "var(--panel-bg)", border: `1px solid ${room.active ? room.color + "22" : "var(--surface-muted)"}`,
                borderLeft: `4px solid ${room.active ? room.color : "var(--text-disabled)"}`,
                borderRadius: 14, transition: "all .15s",
                opacity: room.active ? 1 : 0.6
              }}>
                {/* Name + desc */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, background: room.color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={18} color={room.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{room.description}</div>
                  </div>
                </div>

                {/* Floor */}
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{room.floor}</div>

                {/* Capacity */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Users size={13} color={room.color} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{room.capacity}</span>
                </div>

                {/* Amenities */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {room.amenities.slice(0, 3).map(a => {
                    const Icon = AMENITY_ICONS[a];
                    return Icon ? (
                      <div key={a} style={{ background: "var(--surface-bg)", borderRadius: 6, padding: "3px 7px", display: "flex", alignItems: "center", gap: 3 }}>
                        <Icon size={10} color={room.color} />
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{a}</span>
                      </div>
                    ) : null;
                  })}
                  {room.amenities.length > 3 && (
                    <div style={{ background: "var(--surface-bg)", borderRadius: 6, padding: "3px 7px", fontSize: 10, color: "var(--text-muted)" }}>+{room.amenities.length - 3}</div>
                  )}
                </div>

                {/* Booking count */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.total}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{stats.today} hari ini</div>
                </div>

                {/* Active toggle */}
                <div>
                  <button onClick={() => onToggleActive(room.id)} style={{
                    background: room.active ? "var(--success-bg)" : "var(--surface-muted)",
                    color: room.active ? "var(--success)" : "var(--text-muted)",
                    border: `1px solid ${room.active ? "var(--success-soft)" : "var(--text-disabled)"}`,
                    borderRadius: 20, padding: "4px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap"
                  }}>
                    {room.active ? "Aktif" : "Nonaktif"}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(room)} style={{
                    width: 34, height: 34, background: "var(--surface-bg)", border: "1px solid var(--surface-muted)",
                    borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-secondary)", transition: "all .15s"
                  }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(room)} style={{
                    width: 34, height: 34, background: "var(--danger-bg)", border: "1px solid var(--danger-soft)",
                    borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--danger)", transition: "all .15s"
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DEPT FORM MODAL ──────────────────────────────────────────────────────────
const DEPT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16", "#e879f9", "#fb923c"];

function DeptFormModal({ dept, users, onSave, onClose }) {
  const isEdit = !!dept;
  const activeUsers = users.filter(u => u.active);
  const [form, setForm] = useState({
    name: dept?.name || "",
    color: dept?.color || "#6366f1",
    description: dept?.description || "",
    head: dept?.head || activeUsers[0]?.name || "",
    active: dept?.active !== undefined ? dept.active : true,
  });
  const [error, setError] = useState("");
  const inp = (f, v) => setForm(x => ({ ...x, [f]: v }));

  const submit = () => {
    if (!form.name.trim()) return setError("Nama departemen wajib diisi.");
    setError("");
    onSave({ ...form, id: dept?.id || Date.now() });
  };

  const inputStyle = { background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)", padding: "10px 14px", width: "100%", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: form.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={22} color={form.color} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Departemen" : "Tambah Departemen"}</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{isEdit ? `Perbarui data ${dept.name}` : "Daftarkan departemen baru"}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={labelStyle}>Nama Departemen *</label>
          <input style={inputStyle} placeholder="Contoh: Engineering" value={form.name} onChange={e => inp("name", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Deskripsi</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 68 }} placeholder="Tugas dan tanggung jawab departemen..." value={form.description} onChange={e => inp("description", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Kepala Departemen</label>
          <select style={inputStyle} value={form.head} onChange={e => inp("head", e.target.value)}>
            <option value="">— Tidak ada —</option>
            {activeUsers.map(u => <option key={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Warna Label</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DEPT_COLORS.map(c => (
              <button key={c} onClick={() => inp("color", c)} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: `3px solid ${form.color === c ? "#fff" : "transparent"}`, cursor: "pointer", transition: "transform .15s", transform: form.color === c ? "scale(1.15)" : "scale(1)" }} />
            ))}
            <input type="color" value={form.color} onChange={e => inp("color", e.target.value)} style={{ width: 36, height: 32, borderRadius: 6, border: "1px solid var(--surface-muted)", background: "var(--surface-bg)", cursor: "pointer" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-bg)", borderRadius: 12, padding: "14px 18px" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Status Aktif</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Departemen nonaktif tidak muncul di form booking</div>
          </div>
          <button onClick={() => inp("active", !form.active)} style={{ background: form.active ? form.color : "var(--text-disabled)", border: "none", borderRadius: 20, width: 52, height: 28, cursor: "pointer", position: "relative", transition: "background .2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.active ? 27 : 3, transition: "left .2s" }} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 16, background: "var(--panel-elevated)", border: `1px solid ${form.color}44`, borderLeft: `4px solid ${form.color}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: form.color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Briefcase size={18} color={form.color} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{form.name || "Nama Departemen"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{form.head ? `Kepala: ${form.head}` : "Tanpa kepala"}</div>
        </div>
        <span style={{ marginLeft: "auto", background: form.active ? "var(--success-bg)" : "var(--surface-muted)", color: form.active ? "var(--success)" : "var(--text-muted)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{form.active ? "Aktif" : "Nonaktif"}</span>
      </div>

      {error && <div style={{ marginTop: 14, background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "12px 16px", color: "var(--danger)", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><AlertCircle size={16} />{error}</div>}

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Batal</button>
        <button onClick={submit} style={{ flex: 2, background: form.color, border: "none", color: "#000", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700 }}>
          {isEdit ? "Simpan Perubahan" : "Tambah Departemen"} →
        </button>
      </div>
    </Modal>
  );
}

// ─── DEPT VIEW ────────────────────────────────────────────────────────────────
function DepartmentsView({ departments, users, bookings, onAdd, onEdit, onDelete, onToggleActive }) {
  const [search, setSearch] = useState("");

  const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || (d.description || "").toLowerCase().includes(search.toLowerCase()));

  const getDeptStats = (deptName) => {
    const members = users.filter(u => u.department === deptName);
    const totalBookings = bookings.filter(b => b.department === deptName && b.status !== "cancelled").length;
    const todayBookings = bookings.filter(b => b.department === deptName && b.date === todayStr && b.status !== "cancelled").length;
    return { members: members.length, totalBookings, todayBookings };
  };

  const inputStyle = { background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)", padding: "9px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Kelola Departemen</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>{departments.filter(d => d.active).length} aktif</span>
            {" · "}{departments.filter(d => !d.active).length} nonaktif{" · "}{departments.length} total
          </p>
        </div>
        <button onClick={onAdd} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={17} /> Tambah Departemen
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          [Briefcase, "Total Dept", departments.length, "#6366f1"],
          [CheckCircle, "Aktif", departments.filter(d => d.active).length, "#10b981"],
          [Users, "Total Anggota", users.filter(u => u.active).length, "#f59e0b"],
          [BarChart2, "Booking Bulan Ini", bookings.filter(b => b.status !== "cancelled").length, "#ec4899"],
        ].map(([Icon, label, val, color]) => (
          <div key={label} style={{ background: "var(--panel-bg)", border: `1px solid ${color}22`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ width: 36, height: 36, background: color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon size={18} color={color} /></div>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360, marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input placeholder="Cari departemen..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }} />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
        {filtered.map(dept => {
          const stats = getDeptStats(dept.name);
          const headUser = users.find(u => u.name === dept.head);
          return (
            <div key={dept.id} style={{ background: "var(--panel-bg)", border: `1px solid ${dept.active ? dept.color + "33" : "var(--surface-muted)"}`, borderRadius: 16, padding: "20px", position: "relative", opacity: dept.active ? 1 : 0.6, transition: "all .15s" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: dept.active ? dept.color : "var(--text-disabled)", borderRadius: "16px 16px 0 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: dept.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={22} color={dept.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{dept.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{dept.description || "Tidak ada deskripsi"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onEdit(dept)} style={{ width: 32, height: 32, background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Pencil size={13} /></button>
                  <button onClick={() => onDelete(dept)} style={{ width: 32, height: 32, background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Kepala */}
              {dept.head && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-bg)", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: headUser?.avatarColor || dept.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {dept.head.split(" ").map(x => x[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Kepala</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{dept.head}</div>
                  </div>
                  <Crown size={13} color="#f59e0b" style={{ marginLeft: "auto" }} />
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  [Users, stats.members, "Anggota"],
                  [BarChart2, stats.totalBookings, "Booking"],
                  [Calendar, stats.todayBookings, "Hari ini"],
                ].map(([Icon, val, lbl]) => (
                  <div key={lbl} style={{ background: "var(--panel-elevated)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                    <Icon size={13} color={dept.color} style={{ marginBottom: 3 }} />
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{val}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => onToggleActive(dept.id)} style={{ background: dept.active ? "var(--success-bg)" : "var(--surface-muted)", color: dept.active ? "var(--success)" : "var(--text-muted)", border: `1px solid ${dept.active ? "var(--success-soft)" : "var(--text-disabled)"}`, borderRadius: 20, padding: "4px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
                  {dept.active ? "● Aktif" : "○ Nonaktif"}
                </button>
                <div style={{ fontSize: 12, color: dept.color, fontWeight: 600 }}>{dept.color}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GENERIC DELETE CONFIRM ───────────────────────────────────────────────────
function GenericDeleteModal({ title, subtitle, warning, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "var(--danger-bg)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Trash2 size={26} color="var(--danger)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: warning ? 16 : 24 }} dangerouslySetInnerHTML={{ __html: subtitle }} />
        {warning && (
          <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning-soft)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: warning }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Batal</button>
          <button onClick={onConfirm} style={{ flex: 1, background: "var(--danger)", border: "none", color: "#fff", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Hapus Sekarang</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── USER FORM MODAL ──────────────────────────────────────────────────────────
const USER_ROLES = [
  { value: "admin", label: "Admin", desc: "Dapat mengelola semua data & booking", color: "#f59e0b", icon: Crown },
  { value: "member", label: "Member", desc: "Dapat membuat dan mengelola booking sendiri", color: "#6366f1", icon: UserCheck },
  { value: "viewer", label: "Viewer", desc: "Hanya bisa melihat jadwal", color: "var(--text-muted)", icon: Eye },
];
const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];

function UserFormModal({ user, departments, onSave, onClose }) {
  const isEdit = !!user;
  const activeDepts = departments.filter(d => d.active);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    department: user?.department || activeDepts[0]?.name || "",
    role: user?.role || "member",
    avatarColor: user?.avatarColor || "#6366f1",
    active: user?.active !== undefined ? user.active : true,
  });
  const [error, setError] = useState("");
  const inp = (f, v) => setForm(x => ({ ...x, [f]: v }));

  const submit = () => {
    if (!form.name.trim()) return setError("Nama wajib diisi.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Format email tidak valid.");
    if (!isEdit && !form.password.trim()) return setError("Password wajib diisi untuk pengguna baru.");
    setError("");
    onSave({ ...form, id: user?.id || Date.now() });
  };

  const initials = form.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase() || "??";
  const selectedRole = USER_ROLES.find(r => r.value === form.role);
  const inputStyle = { background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)", padding: "10px 14px", width: "100%", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: form.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>{initials}</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{isEdit ? `Perbarui profil ${user.name}` : "Daftarkan akun pengguna baru"}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Name */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Nama Lengkap *</label>
          <input style={inputStyle} placeholder="Contoh: Budi Santoso" value={form.name} onChange={e => inp("name", e.target.value)} />
        </div>
        {/* Email */}
        <div>
          <label style={labelStyle}>Email *</label>
          <div style={{ position: "relative" }}>
            <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="budi@company.com" value={form.email} onChange={e => inp("email", e.target.value)} />
          </div>
        </div>
        {/* Phone */}
        <div>
          <label style={labelStyle}>Nomor Telepon</label>
          <div style={{ position: "relative" }}>
            <Phone size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="+62 812-xxxx-xxxx" value={form.phone} onChange={e => inp("phone", e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Password {!isEdit ? "*" : "(opsional)"}</label>
          <div style={{ position: "relative" }}>
            <KeyRound size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input type="password" style={{ ...inputStyle, paddingLeft: 34 }} placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Masukkan password awal"} value={form.password} onChange={e => inp("password", e.target.value)} />
          </div>
        </div>
        {/* Department */}
        <div>
          <label style={labelStyle}>Departemen</label>
          <select style={inputStyle} value={form.department} onChange={e => inp("department", e.target.value)}>
            {activeDepts.map(d => <option key={d.id}>{d.name}</option>)}
          </select>
        </div>
        {/* Role */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Role / Hak Akses</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {USER_ROLES.map(r => {
              const RIcon = r.icon;
              const sel = form.role === r.value;
              return (
                <button key={r.value} onClick={() => inp("role", r.value)} style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${sel ? r.color : "var(--border-color)"}`, background: sel ? r.color + "15" : "var(--surface-bg)", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <RIcon size={16} color={r.color} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: sel ? r.color : "var(--text-primary)" }}>{r.label}</span>
                    {sel && <Check size={13} color={r.color} style={{ marginLeft: "auto" }} />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{r.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Avatar color */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Warna Avatar</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {AVATAR_COLORS.map(c => (
              <button key={c} onClick={() => inp("avatarColor", c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: `3px solid ${form.avatarColor === c ? "#fff" : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", transition: "transform .15s", transform: form.avatarColor === c ? "scale(1.2)" : "scale(1)" }}>
                {form.avatarColor === c && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
        {/* Active */}
        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-bg)", borderRadius: 12, padding: "14px 18px" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Status Akun</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Pengguna nonaktif tidak bisa membuat booking</div>
          </div>
          <button onClick={() => inp("active", !form.active)} style={{ background: form.active ? form.avatarColor : "var(--text-disabled)", border: "none", borderRadius: 20, width: 52, height: 28, cursor: "pointer", position: "relative", transition: "background .2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.active ? 27 : 3, transition: "left .2s" }} />
          </button>
        </div>
      </div>

      {error && <div style={{ marginTop: 14, background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "12px 16px", color: "var(--danger)", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><AlertCircle size={16} />{error}</div>}

      {/* Preview card */}
      <div style={{ marginTop: 16, background: "var(--panel-elevated)", border: `1px solid ${form.avatarColor}44`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: form.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{form.name || "Nama Pengguna"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{form.email || "email@company.com"} · {form.department || "—"}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ background: selectedRole?.color + "22", color: selectedRole?.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{selectedRole?.label}</span>
          <span style={{ background: form.active ? "var(--success-bg)" : "var(--surface-muted)", color: form.active ? "var(--success)" : "var(--text-muted)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{form.active ? "Aktif" : "Nonaktif"}</span>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Batal</button>
        <button onClick={submit} style={{ flex: 2, background: form.avatarColor, border: "none", color: "#000", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700 }}>
          {isEdit ? "Simpan Perubahan" : "Tambah Pengguna"} →
        </button>
      </div>
    </Modal>
  );
}

// ─── USERS VIEW ───────────────────────────────────────────────────────────────
function UsersView({ users, departments, bookings, onAdd, onEdit, onDelete, onToggleActive }) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filtered = users
    .filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept === "all" || u.department === filterDept;
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchDept && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "dept") return a.department.localeCompare(b.department);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return 0;
    });

  const getUserStats = (userName) => ({
    bookings: bookings.filter(b => b.organizer === userName && b.status !== "cancelled").length,
    upcoming: bookings.filter(b => b.organizer === userName && b.date >= todayStr && b.status === "confirmed").length,
  });

  const inputStyle = { background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 10, color: "var(--text-primary)", padding: "9px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Kelola Pengguna</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>{users.filter(u => u.active).length} aktif</span>
            {" · "}{users.filter(u => !u.active).length} nonaktif{" · "}{users.length} total
          </p>
        </div>
        <button onClick={onAdd} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus size={17} /> Tambah Pengguna
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          [Users, "Total User", users.length, "#6366f1"],
          [Crown, "Admin", users.filter(u => u.role === "admin").length, "#f59e0b"],
          [UserCheck, "Member", users.filter(u => u.role === "member").length, "#10b981"],
          [Eye, "Viewer", users.filter(u => u.role === "viewer").length, "var(--text-muted)"],
        ].map(([Icon, label, val, color]) => (
          <div key={label} style={{ background: "var(--panel-bg)", border: `1px solid ${color}22`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ width: 36, height: 36, background: color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon size={18} color={color} /></div>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }} />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">Semua Dept</option>
          {departments.map(d => <option key={d.id}>{d.name}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">Semua Role</option>
          {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="name">Urut: Nama</option>
          <option value="dept">Urut: Dept</option>
          <option value="role">Urut: Role</option>
        </select>
      </div>

      {/* Table header */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p>Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "8px 18px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>
            <span>Pengguna</span><span>Departemen</span><span>Role</span><span>Booking</span><span>Upcoming</span><span>Status</span><span>Aksi</span>
          </div>
          {filtered.map(user => {
            const stats = getUserStats(user.name);
            const roleConf = USER_ROLES.find(r => r.value === user.role);
            const deptConf = departments.find(d => d.name === user.department);
            const RoleIcon = roleConf?.icon || Eye;
            return (
              <div key={user.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "14px 18px", alignItems: "center", background: "var(--panel-bg)", border: `1px solid ${user.active ? "var(--surface-muted)" : "#111"}`, borderLeft: `4px solid ${user.active ? user.avatarColor : "var(--text-disabled)"}`, borderRadius: 14, opacity: user.active ? 1 : 0.55, transition: "all .15s" }}>
                {/* Avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {user.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.email}</div>
                    {user.phone && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{user.phone}</div>}
                  </div>
                </div>
                {/* Dept */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {deptConf && <div style={{ width: 8, height: 8, borderRadius: "50%", background: deptConf.color, flexShrink: 0 }} />}
                  <span style={{ fontSize: 13 }}>{user.department}</span>
                </div>
                {/* Role badge */}
                <div>
                  <span style={{ background: roleConf?.color + "22", color: roleConf?.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <RoleIcon size={10} />{roleConf?.label}
                  </span>
                </div>
                {/* Stats */}
                <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.bookings}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>{stats.upcoming}</div>
                {/* Toggle */}
                <div>
                  <button onClick={() => onToggleActive(user.id)} style={{ background: user.active ? "var(--success-bg)" : "var(--surface-muted)", color: user.active ? "var(--success)" : "var(--text-muted)", border: `1px solid ${user.active ? "var(--success-soft)" : "var(--text-disabled)"}`, borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                    {user.active ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(user)} style={{ width: 34, height: 34, background: "var(--surface-bg)", border: "1px solid var(--surface-muted)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Pencil size={14} /></button>
                  <button onClick={() => onDelete(user)} style={{ width: 34, height: 34, background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Lockout countdown
  useEffect(() => {
    if (locked && lockTimer > 0) {
      const t = setTimeout(() => setLockTimer(n => n - 1), 1000);
      return () => clearTimeout(t);
    }
    if (locked && lockTimer === 0) setLocked(false);
  }, [locked, lockTimer]);

  const handleLogin = async () => {
    if (locked || loading) return;
    if (!email.trim() || !password.trim()) return setError("Email dan password wajib diisi.");
    setLoading(true);
    setError("");
    try {
      await onLogin({ email, password, remember });
      setAttempts(0);
    } catch (loginError) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setLockTimer(30);
        setError("Terlalu banyak percobaan. Akun dikunci 30 detik.");
      } else {
        setError(`${loginError.message || "Email atau password salah."} (${next}/5 percobaan)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inpStyle = (hasErr) => ({
    width: "100%", boxSizing: "border-box", background: "var(--panel-bg)",
    border: `1px solid ${hasErr ? "var(--danger)" : "var(--border-color)"}`, borderRadius: 12,
    color: "var(--text-primary)", padding: "13px 16px", fontSize: 15,
    fontFamily: "'DM Sans',sans-serif", outline: "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,#6366f130,transparent 70%)", top: -150, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,#8b5cf620,transparent 70%)", bottom: -100, left: -80, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 32px #6366f140" }}>
            <Building2 size={30} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 }}>MeetSpace</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Masuk untuk mengelola booking ruang meeting</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 20, padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>
          <div>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8, fontWeight: 600 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="email" placeholder="nama@company.com" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ ...inpStyle(!!error), paddingLeft: 44 }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8, fontWeight: 600 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type={showPass ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ ...inpStyle(!!error), paddingLeft: 44, paddingRight: 44 }} />
                <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setRemember(r => !r)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${remember ? "#6366f1" : "var(--text-disabled)"}`, background: remember ? "#6366f1" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
                {remember && <Check size={12} color="#fff" />}
              </button>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ingat saya di perangkat ini</span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--danger)" }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                {error}
                {locked && <span style={{ marginLeft: "auto", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{lockTimer}s</span>}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading || locked} style={{ width: "100%", background: locked ? "var(--text-disabled)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: locked ? "var(--text-muted)" : "#fff", borderRadius: 12, padding: "14px", cursor: locked ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "opacity .2s", opacity: loading ? 0.7 : 1 }}>
              {loading ? <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> : <LogIn size={18} />}
              {locked ? `Dikunci ${lockTimer}s` : loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </div>
        </div>

        {/* Security note */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: "var(--text-faint)" }}>
          <Shield size={13} />
          <span>Halaman ini dilindungi enkripsi. Jangan bagikan kredensial Anda.</span>
        </div>

        {/* Public access note */}
        <div style={{ marginTop: 12, background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
          <Eye size={14} color="#6366f1" style={{ flexShrink: 0 }} />
          <span>Kalender, ketersediaan, dan analitik dapat dilihat tanpa login.</span>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─── AUTH: LOGIN PROMPT MODAL ─────────────────────────────────────────────────
function LoginPromptModal({ onGoLogin, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#6366f130,#8b5cf620)", border: "1px solid #6366f144", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <KeyRound size={28} color="#6366f1" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Login Diperlukan</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Anda harus masuk terlebih dahulu untuk melakukan booking atau mengakses fitur ini.
          <br />Halaman Kalender, Ketersediaan, dan Analytics tetap bisa dilihat tanpa login.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Nanti Saja</button>
          <button onClick={onGoLogin} style={{ flex: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <LogIn size={16} /> Masuk Sekarang →
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MeetingApp() {
  const { state, actions } = useMeetingAppController();
  const {
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
    activeRooms,
    navItems,
    upcoming,
  } = state;
  const {
    setModal,
    setShowLogin,
    setLayout,
    toggleTheme,
    removeToast,
    handleLogin,
    handleLogout,
    handleNavClick,
    requireAuth,
    handleCancel,
    handleToggleRoom,
    handleToggleDept,
    handleToggleUser,
    handleAddRoom,
    handleEditRoom,
    handleDeleteRoom,
    handleAddDept,
    handleEditDept,
    handleDeleteDept,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleSaveBooking,
    handleCheckin,
  } = actions;

  if (initializing) {
    return (
      <>
        <style>{APP_THEME_STYLE}</style>
        <LoadingScreen />
      </>
    );
  }

  if (showLogin) {
    return (
      <div data-meetspace-theme={theme}>
        <style>{APP_THEME_STYLE}</style>
        <LoginPage onLogin={handleLogin} />
        <button onClick={() => setShowLogin(false)} style={{ position: "fixed", top: 20, left: 20, background: "var(--surface-muted)", border: "none", color: "var(--text-secondary)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, zIndex: 9999 }}>
          <ChevronLeft size={14} /> Lihat tanpa login
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{APP_THEME_STYLE}</style>
      <LayoutWrapper layout={layout} theme={theme}>
        <AppSidebar
          authUser={authUser}
          view={view}
          navItems={navItems}
          rooms={rooms}
          departments={departments}
          users={users}
          upcoming={upcoming}
          layout={layout}
          theme={theme}
          onNavClick={handleNavClick}
          onSetLayout={setLayout}
          onToggleTheme={toggleTheme}
          onOpenLogin={() => setShowLogin(true)}
          onOpenBooking={() => requireAuth(() => setModal({ type: "booking" }))}
          onLogout={handleLogout}
        />

        <MeetingAppContent
          view={view}
          authUser={authUser}
          rooms={rooms}
          activeRooms={activeRooms}
          departments={departments}
          users={users}
          bookings={bookings}
          views={{
            CalendarView,
            AvailabilityView,
            MyBookingsView,
            AnalyticsView,
            RoomsView,
            DepartmentsView,
            UsersView,
          }}
          onRequireBooking={(room, date) => requireAuth(() => setModal({ type: "booking", preRoom: room, preDate: date }))}
          onBookingClick={(booking) => setModal({ type: "detail", booking })}
          onCancel={handleCancel}
          onRoomAdd={() => setModal({ type: "roomAdd" })}
          onRoomEdit={(room) => setModal({ type: "roomEdit", room })}
          onRoomDelete={(room) => setModal({ type: "roomDelete", room })}
          onToggleRoom={handleToggleRoom}
          onDeptAdd={() => setModal({ type: "deptAdd" })}
          onDeptEdit={(dept) => setModal({ type: "deptEdit", dept })}
          onDeptDelete={(dept) => setModal({ type: "deptDelete", dept })}
          onToggleDept={handleToggleDept}
          onUserAdd={() => setModal({ type: "userAdd" })}
          onUserEdit={(user) => setModal({ type: "userEdit", user })}
          onUserDelete={(user) => setModal({ type: "userDelete", user })}
          onToggleUser={handleToggleUser}
        />

        <MeetingAppModals
          modal={modal}
          authUser={authUser}
          rooms={rooms}
          activeRooms={activeRooms}
          departments={departments}
          users={users}
          bookings={bookings}
          components={{
            LoginPromptModal,
            BookingModal,
            DetailModal,
            RoomFormModal,
            DeleteConfirmModal,
            DeptFormModal,
            GenericDeleteModal,
            UserFormModal,
          }}
          actions={{
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
          }}
        />

        <Toast toasts={toasts} remove={removeToast} />
      </LayoutWrapper>
    </>
  );
}