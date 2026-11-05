import { useEffect, useState } from "react";
import { getRoles, type RoleRecord } from "../../../services/roles.service";
import { errorMessage } from "../../../services/http";
import { roleLabel } from "../../../auth/session";
import "../../../css/users.css";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getRoles()
      .then((data) => {
        if (!cancelled) setRoles(data);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "No fue posible cargar los roles."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h2>Roles</h2>
          <p>Roles que existen en el sistema de Taller y Repuestos JD.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Listado de roles</h3>
            <p>{roles.length} rol(es) registrados</p>
          </div>
        </div>

        {loading ? (
          <div className="state">Cargando roles...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : roles.length === 0 ? (
          <div className="state">No hay roles registrados.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rol</th>
                  <th>Nombre en la base de datos</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.id}</td>
                    <td>
                      <span className={`badge badge-role badge-${role.name.toLowerCase()}`}>
                        {roleLabel(role.name)}
                      </span>
                    </td>
                    <td>
                      <code>{role.name}</code>
                    </td>
                    <td>{role.description || "—"}</td>
                    <td>
                      <span className={`badge ${role.status === 1 ? "badge-ok" : "badge-off"}`}>
                        {role.status === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="note">
          Los roles son de solo lectura: se administran directamente en la base
          de datos porque el sistema depende de sus nombres.
        </p>
      </section>
    </div>
  );
}
