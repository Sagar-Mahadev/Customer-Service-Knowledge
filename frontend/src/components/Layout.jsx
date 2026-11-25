import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/customers", label: "Customers", icon: "person" },
  { path: "/tickets", label: "Support Tickets", icon: "confirmation_number" },
  { path: "/categories", label: "Categories", icon: "category" },
  { path: "/articles", label: "Knowledge Articles", icon: "menu_book" },
];

export default function Layout() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const location = useLocation();

  // Sync theme to <html data-theme="..."> and save in localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const currentPage = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 10px 18px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--accent)", fontSize: "26px" }}
          >
            support_agent
          </span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>
              Resolution Hub
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Knowledge Platform
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginTop: "18px",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                backgroundColor: isActive
                  ? "var(--accent-soft)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(234, 179, 8, 0.35)"
                  : "1px solid transparent",
                transition: "all 0.15s ease",
              })}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "19px" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Right Column: Top Header + Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <header
          style={{
            height: "60px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-sidebar)",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: "16px", fontWeight: 600 }}>
            {currentPage ? currentPage.label : "Dashboard"}
          </h1>

          {/* Light / Dark Toggle Button */}
          <button
            className="btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Mode"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: "var(--accent)" }}
            >
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </header>

        {/* Active Page Renders Here */}
        <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
          <Outlet />
        </main>

        <footer
          style={{
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-sidebar)",
            padding: "12px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "var(--text-muted)",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>
            © {new Date().getFullYear()} Resolution Hub — Customer Service
            Knowledge Platform
          </span>
          <span>Workspace for your Operations</span>
        </footer>
      </div>
    </div>
  );
}
