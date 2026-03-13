import dynamic from "next/dynamic";

// Gunakan dynamic import dengan SSR dimatikan
// karena komponen ini menggunakan browser API (window, localStorage)
const MeetingApp = dynamic(() => import("../components/MeetingApp"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#080b11", color: "#6b7280",
      fontFamily: "sans-serif", fontSize: 14, gap: 12
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Memuat aplikasi...
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
});

export default function Home() {
  return <MeetingApp />;
}