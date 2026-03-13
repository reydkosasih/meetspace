import {
  Calendar,
  Layers,
  Star,
  BarChart2,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";

export const PUBLIC_VIEWS = ["calendar", "availability", "analytics"];
export const ADMIN_VIEWS = ["rooms", "departments", "users"];

export const NAV_ITEMS = [
  { id: "calendar", label: "Kalender", icon: Calendar, group: "main", public: true },
  { id: "availability", label: "Ketersediaan", icon: Layers, group: "main", public: true },
  { id: "mybookings", label: "Booking Saya", icon: Star, group: "main", public: false },
  { id: "analytics", label: "Analytics", icon: BarChart2, group: "main", public: true },
  { id: "rooms", label: "Kelola Ruangan", icon: Building2, group: "admin", public: false },
  { id: "departments", label: "Departemen", icon: Briefcase, group: "admin", public: false },
  { id: "users", label: "Pengguna", icon: Users, group: "admin", public: false },
];

export const ROLE_BADGE_COLOR = {
  admin: "#f59e0b",
  member: "#6366f1",
  viewer: "#6b7280",
};

export const APP_THEME_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  [data-meetspace-theme="dark"] {
    --app-bg: #080b11;
    --sidebar-bg: #0c0e16;
    --panel-bg: #0f1117;
    --panel-elevated: #111320;
    --surface-bg: #1a1d27;
    --surface-muted: #1f2937;
    --border-color: #2d3141;
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --text-faint: #4b5563;
    --text-disabled: #374151;
    --success: #10b981;
    --success-bg: #052e16;
    --success-soft: rgba(16, 185, 129, 0.2);
    --warning: #f59e0b;
    --warning-bg: #1c1200;
    --warning-soft: rgba(245, 158, 11, 0.27);
    --danger: #ef4444;
    --danger-bg: #1f0000;
    --danger-soft: rgba(239, 68, 68, 0.27);
    --info: #6366f1;
    --info-bg: #0c0c20;
    --calendar-selected-bg: #1e293b;
    --calendar-today-bg: #0c1624;
    --calendar-today-border: #2d3a5a;
    --calendar-selected-text: #c7d2fe;
    --calendar-day-text: #d1d5db;
    --timeline-slot-bg: #1a1f2e;
    --timeline-current-bg: #1a1a3e;
    --timeline-buffer-bg: #2d1f00;
  }
  [data-meetspace-theme="light"] {
    --app-bg: #eef2ff;
    --sidebar-bg: #ffffff;
    --panel-bg: #ffffff;
    --panel-elevated: #f8fafc;
    --surface-bg: #f1f5f9;
    --surface-muted: #e2e8f0;
    --border-color: #cbd5e1;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #64748b;
    --text-faint: #94a3b8;
    --text-disabled: #94a3b8;
    --success: #059669;
    --success-bg: #ecfdf5;
    --success-soft: rgba(5, 150, 105, 0.18);
    --warning: #d97706;
    --warning-bg: #fff7ed;
    --warning-soft: rgba(217, 119, 6, 0.2);
    --danger: #dc2626;
    --danger-bg: #fef2f2;
    --danger-soft: rgba(220, 38, 38, 0.18);
    --info: #4f46e5;
    --info-bg: #eef2ff;
    --calendar-selected-bg: #dbeafe;
    --calendar-today-bg: #e0f2fe;
    --calendar-today-border: #93c5fd;
    --calendar-selected-text: #3730a3;
    --calendar-day-text: #334155;
    --timeline-slot-bg: #eef2ff;
    --timeline-current-bg: #dbeafe;
    --timeline-buffer-bg: #fef3c7;
  }
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:3px; }
  select option { background:var(--surface-bg); color:var(--text-primary); }
  textarea { font-family:'DM Sans',sans-serif; }
  @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes scan { from{transform:translateY(0)} to{transform:translateY(160px)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;
