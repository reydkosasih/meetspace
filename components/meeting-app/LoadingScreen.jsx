import { RefreshCw } from "lucide-react";

export function LoadingScreen() {
  return (
    <div data-meetspace-theme="dark" style={{ minHeight: "100vh", background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--panel-bg)", border: "1px solid var(--surface-muted)", borderRadius: 16, padding: "18px 22px" }}>
        <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
        Memuat data MeetSpace...
      </div>
    </div>
  );
}
