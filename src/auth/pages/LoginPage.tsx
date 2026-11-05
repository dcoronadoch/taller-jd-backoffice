import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/auth.service";
import { errorMessage } from "../../services/http";
import {
  BACKOFFICE_ROLES,
  isAuthenticated,
  saveSession,
} from "../session";
import "../../css/login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay una sesión vigente, no se muestra el formulario.
  if (isAuthenticated()) {
    return <Navigate to="/users" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);
      const role = data.user.role.trim().toUpperCase();

      // Solo los roles autorizados pueden entrar al Backoffice.
      if (!BACKOFFICE_ROLES.includes(role)) {
        setError("Su cuenta no tiene acceso al Backoffice.");
        return;
      }

      saveSession(data.token, { ...data.user, role });
      navigate("/users", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "No fue posible iniciar sesión."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-brand">
          <img src="/logo-jd.png" alt="" />
          <div>
            <strong>
              Taller y Repuestos <span>JD</span>
            </strong>
            <small>Backoffice</small>
          </div>
        </header>

        <h1>Iniciar sesión</h1>
        <p className="login-intro">
          Ingrese sus credenciales para acceder al panel de administración.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tallerjd.com"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Su contraseña"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <footer className="login-footer">
          Taller y Repuestos JD · Panel de administración
        </footer>
      </section>
    </main>
  );
}
