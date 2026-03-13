import { Building2, LayoutPanelLeft, Lock, LogIn, LogOut, Maximize2, Moon, Plus, Sun, UserCircle2 } from "lucide-react";

import { ROLE_BADGE_COLOR } from "./constants";

export function AppSidebar({
  authUser,
  view,
  navItems,
  rooms,
  departments,
  users,
  upcoming,
  layout,
  theme,
  onNavClick,
  onSetLayout,
  onToggleTheme,
  onOpenLogin,
  onOpenBooking,
  onLogout,
}) {
  return (
    <div style={{ width: 230, background: "var(--sidebar-bg)", borderRight: "1px solid var(--surface-bg)", display: "flex", flexDirection: "column", flexShrink: 0, padding: "24px 0", overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: "var(--text-primary)" }}>MeetSpace</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "var(--text-secondary)" }}>Room Booking</div>
          </div>
        </div>
      </div>

      {!authUser && (
        <div style={{ margin: "0 12px 16px", background: "var(--surface-bg)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 12, padding: "12px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.5 }}>Anda browsing sebagai tamu. Login untuk fitur penuh.</div>
          <button onClick={onOpenLogin} style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 8, padding: "9px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <LogIn size={14} /> Masuk
          </button>
        </div>
      )}

      <nav style={{ flex: 1, padding: "0 12px" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, padding: "0 4px 8px", fontWeight: 600 }}>Menu</div>
        {navItems.filter((item) => item.group === "main").map(({ id, label, icon: Icon, public: isPublic }) => {
          const locked = !isPublic && !authUser;
          const active = view === id;
          return (
            <button key={id} onClick={() => onNavClick(id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: active ? "var(--surface-bg)" : "transparent", color: active ? "var(--text-primary)" : locked ? "var(--text-faint)" : "var(--text-muted)", fontWeight: active ? 600 : 400, transition: "all .15s", textAlign: "left" }}>
              <Icon size={17} color={active ? "#6366f1" : locked ? "var(--text-disabled)" : "var(--text-muted)"} />
              {label}
              {isPublic && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-faint)", background: "var(--surface-bg)", borderRadius: 6, padding: "1px 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Publik</span>}
              {id === "mybookings" && upcoming > 0 && authUser && <span style={{ marginLeft: "auto", background: "#6366f1", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{upcoming}</span>}
              {locked && <Lock size={11} style={{ marginLeft: "auto" }} color="var(--text-disabled)" />}
            </button>
          );
        })}

        {authUser?.role === "admin" && (
          <>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, padding: "14px 4px 8px", fontWeight: 600 }}>Admin</div>
            {navItems.filter((item) => item.group === "admin").map(({ id, label, icon: Icon }) => {
              const count = id === "rooms" ? rooms.length : id === "departments" ? departments.length : users.length;
              const active = view === id;
              return (
                <button key={id} onClick={() => onNavClick(id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: active ? "var(--surface-bg)" : "transparent", color: active ? "var(--text-primary)" : "var(--text-muted)", fontWeight: active ? 600 : 400, transition: "all .15s", textAlign: "left" }}>
                  <Icon size={17} color={active ? "#6366f1" : "var(--text-muted)"} />
                  {label}
                  <span style={{ marginLeft: "auto", background: "var(--surface-muted)", color: "var(--text-muted)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div style={{ padding: "0 12px 10px" }}>
        <button onClick={onOpenBooking} style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 12, padding: "12px", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Plus size={16} /> Booking Baru
          {!authUser && <Lock size={12} style={{ opacity: 0.7 }} />}
        </button>
      </div>

      <div style={{ padding: "0 12px 10px" }}>
        <div style={{ background: "var(--panel-elevated)", border: "1px solid var(--surface-muted)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, fontWeight: 600 }}>Layout</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["boxed", "Boxed", LayoutPanelLeft], ["fluid", "Fluid", Maximize2]].map(([value, label, Icon]) => (
              <button key={value} onClick={() => onSetLayout(value)} style={{ flex: 1, background: layout === value ? "rgba(99, 102, 241, 0.12)" : "transparent", border: `1px solid ${layout === value ? "#6366f1" : "var(--surface-muted)"}`, borderRadius: 8, padding: "7px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .15s" }}>
                <Icon size={14} color={layout === value ? "#6366f1" : "var(--text-faint)"} />
                <span style={{ fontSize: 10, color: layout === value ? "#6366f1" : "var(--text-faint)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: layout === value ? 700 : 400 }}>{label}</span>
              </button>
            ))}
          </div>
          <button onClick={onToggleTheme} style={{ width: "100%", background: "var(--surface-bg)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "9px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-primary)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Switch</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 16px 0", borderTop: "1px solid var(--surface-bg)" }}>
        {authUser ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: authUser.avatarColor || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {authUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{authUser.name.split(" ")[0]}</div>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, background: (ROLE_BADGE_COLOR[authUser.role] || "#6366f1") + "18", color: ROLE_BADGE_COLOR[authUser.role] || "#6366f1", border: `1px solid ${(ROLE_BADGE_COLOR[authUser.role] || "#6366f1") + "33"}`, borderRadius: 10, padding: "1px 7px", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>{authUser.role}</span>
              </div>
              <button onClick={onLogout} title="Logout" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-soft)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", flexShrink: 0 }}>
                <LogOut size={13} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", paddingBottom: 4 }}>{authUser.email}</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <UserCircle2 size={22} color="var(--text-disabled)" />
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Tamu — Tidak login</span>
          </div>
        )}
      </div>
    </div>
  );
}
