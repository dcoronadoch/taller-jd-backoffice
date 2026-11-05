import { useEffect, useState, type FormEvent } from "react";
import {
  createUser,
  getUserRoles,
  getUsers,
  updateUser,
  updateUserStatus,
  type UserInput,
  type UserRecord,
  type UserRole,
} from "../../../services/users.service";
import { errorMessage } from "../../../services/http";
import { getUser, roleLabel } from "../../../auth/session";
import ConfirmModal from "../../../components/ConfirmModal";
import Pagination from "../../../components/Pagination";
import "../../../css/users.css";

type FormState = {
  email: string;
  password: string;
  role_id: string;
  status: number;
};

const emptyForm: FormState = { email: "", password: "", role_id: "", status: 1 };

const dateFormat = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

export default function UsersPage() {
  const currentUserId = getUser()?.id;

  // Listado
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Formulario (crear / editar)
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmación para desactivar
  const [toDeactivate, setToDeactivate] = useState<UserRecord | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  // Carga los roles disponibles una sola vez.
  useEffect(() => {
    getUserRoles()
      .then(setRoles)
      .catch((e) => setError(errorMessage(e, "No fue posible cargar los roles.")));
  }, []);

  // Carga la lista cuando cambia la página, el tamaño, la búsqueda o se pide recargar.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getUsers(page, limit, query);

        if (cancelled) return;

        setUsers(result.data);
        setTotal(result.pagination.total);
        setTotalPages(Math.max(1, result.pagination.totalPages));
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "No fue posible cargar los usuarios."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [page, limit, query, reloadKey]);

  function reload() {
    setReloadKey((key) => key + 1);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function openCreate() {
    const employee = roles.find((r) => r.name.toUpperCase() === "EMPLOYEE");

    setEditing(null);
    setForm({
      ...emptyForm,
      role_id: String(employee?.id ?? roles[0]?.id ?? ""),
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(user: UserRecord) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      role_id: String(user.role_id),
      status: user.status,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const email = form.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Ingrese un correo electrónico válido.");
      return;
    }

    if (!form.role_id) {
      setFormError("Seleccione un rol.");
      return;
    }

    if (!editing && form.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (editing && form.password && form.password.length < 8) {
      setFormError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const input: UserInput = {
      email,
      password: form.password || undefined,
      role_id: Number(form.role_id),
      status: form.status,
    };

    setSaving(true);

    try {
      if (editing) {
        await updateUser(editing.id, input);
        setNotice("Usuario actualizado correctamente.");
      } else {
        await createUser(input);
        setNotice("Usuario creado correctamente.");
        setPage(1);
      }

      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      reload();
    } catch (e) {
      setFormError(errorMessage(e, "No fue posible guardar el usuario."));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(user: UserRecord, next: 0 | 1) {
    setChangingStatus(true);
    setError("");

    try {
      await updateUserStatus(user.id, next);
      setNotice(
        next === 1
          ? "Usuario activado correctamente."
          : "Usuario desactivado correctamente."
      );
      setToDeactivate(null);
      reload();
    } catch (e) {
      setToDeactivate(null);
      setError(errorMessage(e, "No fue posible cambiar el estado del usuario."));
    } finally {
      setChangingStatus(false);
    }
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(search.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearch("");
    setQuery("");
    setPage(1);
  }

  // Los roles que el formulario puede asignar. Si se edita una cuenta con
  // otro rol (por ejemplo CUSTOMER) el rol se muestra pero no se puede cambiar.
  const editingIsSelf = editing?.id === currentUserId;
  const roleLocked =
    !!editing &&
    (editingIsSelf || !roles.some((role) => role.id === editing.role_id));

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h2>Usuarios</h2>
          <p>Gestione las cuentas de acceso al sistema de Taller y Repuestos JD.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={roles.length === 0}
        >
          + Nuevo usuario
        </button>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Listado de usuarios</h3>
            <p>{total} cuenta(s) registradas</p>
          </div>

          <form className="search" onSubmit={onSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por correo o rol"
              aria-label="Buscar usuarios"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Buscar
            </button>
            {query && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>
                Limpiar
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="state">Cargando usuarios...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : users.length === 0 ? (
          <div className="state">No se encontraron usuarios.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        {user.email}
                        {isSelf && <span className="tag">Usted</span>}
                      </td>
                      <td>
                        <span className={`badge badge-role badge-${user.role.toLowerCase()}`}>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === 1 ? "badge-ok" : "badge-off"}`}>
                          {user.status === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className="actions-col">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          Editar
                        </button>

                        {user.status === 1 ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setToDeactivate(user)}
                            disabled={isSelf}
                            title={isSelf ? "No puede desactivar su propia cuenta" : undefined}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => void changeStatus(user, 1)}
                            disabled={changingStatus}
                          >
                            Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          total={total}
          disabled={loading}
          onPageChange={setPage}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
          }}
        />
      </section>

      {showModal && (
        <div className="modal-overlay" onMouseDown={closeModal}>
          <form
            className="modal"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
            noValidate
          >
            <div className="modal-head">
              <div>
                <h3>{editing ? "Editar usuario" : "Nuevo usuario"}</h3>
                <p>
                  {editing
                    ? "Actualice los datos de acceso de la cuenta."
                    : "Cree una cuenta de acceso para el Backoffice."}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="field span-2">
                  <label htmlFor="user-email">Correo electrónico *</label>
                  <input
                    id="user-email"
                    type="email"
                    maxLength={150}
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="user-role">Rol *</label>
                  <select
                    id="user-role"
                    value={form.role_id}
                    onChange={(event) => updateField("role_id", event.target.value)}
                    disabled={roleLocked}
                    required
                  >
                    {roleLocked && editing && (
                      <option value={editing.role_id}>{roleLabel(editing.role)}</option>
                    )}
                    {!roleLocked &&
                      roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {roleLabel(role.name)}
                        </option>
                      ))}
                  </select>
                  {editingIsSelf && <small>No puede cambiar su propio rol.</small>}
                </div>

                {editing && (
                  <div className="field">
                    <label htmlFor="user-status">Estado</label>
                    <select
                      id="user-status"
                      value={form.status}
                      onChange={(event) => updateField("status", Number(event.target.value))}
                      disabled={editingIsSelf}
                    >
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                    {editingIsSelf && <small>No puede desactivar su propia cuenta.</small>}
                  </div>
                )}

                <div className="field span-2">
                  <label htmlFor="user-password">
                    {editing ? "Nueva contraseña (opcional)" : "Contraseña inicial *"}
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder={editing ? "Dejar en blanco para conservarla" : "Mínimo 8 caracteres"}
                  />
                  <small>
                    {editing
                      ? "La contraseña actual nunca se muestra."
                      : "Mínimo 8 caracteres."}
                  </small>
                </div>
              </div>

              {formError && <div className="alert alert-error">{formError}</div>}
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDeactivate && (
        <ConfirmModal
          title="Desactivar usuario"
          message={`¿Desea desactivar la cuenta de ${toDeactivate.email}? No podrá iniciar sesión hasta que se vuelva a activar.`}
          confirmLabel="Desactivar"
          busy={changingStatus}
          onConfirm={() => void changeStatus(toDeactivate, 0)}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </div>
  );
}
