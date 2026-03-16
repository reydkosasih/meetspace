export function LayoutWrapper({ layout, theme, isMobile, isTablet, children }) {
  if (layout === "fluid" || isMobile) {
    return (
      <div data-meetspace-theme={theme} style={{ width: "100%", height: "100dvh", display: "flex", background: "var(--app-bg)", position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <div data-meetspace-theme={theme} style={{ width: "100%", minHeight: "100vh", background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: isTablet ? "12px" : "16px" }}>
      <div style={{ width: "100%", maxWidth: isTablet ? 1180 : 1440, height: isTablet ? "min(calc(100vh - 24px), 960px)" : "calc(100vh - 32px)", display: "flex", borderRadius: isTablet ? 18 : 20, overflow: "hidden", border: "1px solid var(--surface-bg)", boxShadow: isTablet ? "0 24px 72px rgba(15, 23, 42, 0.18)" : "0 32px 100px rgba(15, 23, 42, 0.22)" }}>
        {children}
      </div>
    </div>
  );
}
