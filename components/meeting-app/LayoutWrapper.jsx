export function LayoutWrapper({ layout, theme, children }) {
  if (layout === "fluid") {
    return (
      <div data-meetspace-theme={theme} style={{ width: "100%", minHeight: "100vh", display: "flex", background: "var(--app-bg)" }}>
        {children}
      </div>
    );
  }

  return (
    <div data-meetspace-theme={theme} style={{ width: "100%", minHeight: "100vh", background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: 1440, height: "calc(100vh - 32px)", display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid var(--surface-bg)", boxShadow: "0 32px 100px rgba(15, 23, 42, 0.22)" }}>
        {children}
      </div>
    </div>
  );
}
