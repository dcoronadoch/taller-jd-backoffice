import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getUser, roleLabel } from "../../auth/session";
import "../../css/layout.css";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAVIGATION = [
  { to: "/parts", label: "Repuestos", icon: "🛞" },
  { to: "/brands", label: "Marcas", icon: "🏷️" },
  { to: "/categories", label: "Categorías", icon: "🗂️" },
  { to: "/users", label: "Usuarios", icon: "👤" },
  { to: "/roles", label: "Roles", icon: "🛡️" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = getUser();
  const email = user?.email ?? "Usuario";
  const avatar = email.charAt(0).toLocaleUpperCase() || "U";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`admin-layout${menuOpen ? " menu-open" : ""}`}>
      {menuOpen && (
        <button
          type="button"
          className="menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src="/logo-jd.png" alt="" />
          <div>
            <strong>
              Taller y Repuestos <span>JD</span>
            </strong>
            <small>Backoffice</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAVIGATION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="menu-button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="header-title">
            <small>TALLER Y REPUESTOS JD</small>
            <h1>Panel de administración</h1>
          </div>

          <div className="header-user">
            <div className="avatar">{avatar}</div>
            <div>
              <strong>{email}</strong>
              <span>{roleLabel(user?.role ?? "")}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
