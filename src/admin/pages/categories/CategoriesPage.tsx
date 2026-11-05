import { useEffect, useState, type FormEvent } from "react";
import {
  createCategory,
  getCategories,
  updateCategory,
  updateCategoryStatus,
  type CategoryRecord,
} from "../../../services/categories.service";
import { errorMessage } from "../../../services/http";
import ConfirmModal from "../../../components/ConfirmModal";
import "../../../css/users.css";
import "../../../css/parts.css";

type FormState = { name: string; description: string };

const emptyForm: FormState = { name: "", description: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Formulario (crear / editar)
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmación para desactivar
  const [toDeactivate, setToDeactivate] = useState<CategoryRecord | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getCategories();
        if (!cancelled) setCategories(result);
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "No fue posible cargar las categorías."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setReloadKey((key) => key + 1);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(category: CategoryRecord) {
    setEditing(category);
    setForm({ name: category.name, description: category.description ?? "" });
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

    const name = form.name.trim();

    if (!name) {
      setFormError("Ingrese el nombre de la categoría.");
      return;
    }

    const input = { name, description: form.description.trim() || null };

    setSaving(true);

    try {
      if (editing) {
        await updateCategory(editing.id, input);
        setNotice("Categoría actualizada correctamente.");
      } else {
        await createCategory(input);
        setNotice("Categoría creada correctamente.");
      }

      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      reload();
    } catch (e) {
      setFormError(errorMessage(e, "No fue posible guardar la categoría."));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(category: CategoryRecord, next: 0 | 1) {
    setChangingStatus(true);
    setActionError("");

    try {
      await updateCategoryStatus(category.id, next);
      setNotice(
        next === 1
          ? "Categoría activada correctamente."
          : "Categoría desactivada correctamente."
      );
      setToDeactivate(null);
      reload();
    } catch (e) {
      setToDeactivate(null);
      setActionError(
        errorMessage(e, "No fue posible cambiar el estado de la categoría.")
      );
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">INVENTARIO</span>
          <h2>Categorías</h2>
          <p>Clasificación de los repuestos (frenos, suspensión, motor...).</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nueva categoría
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

      {actionError && (
        <div className="alert alert-error" role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Listado de categorías</h3>
            <p>{categories.length} categoría(s) registradas</p>
          </div>
        </div>

        {loading ? (
          <div className="state">Cargando categorías...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : categories.length === 0 ? (
          <div className="state">Aún no hay categorías registradas.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.description || "—"}</td>
                    <td>
                      <span
                        className={`badge ${category.status === 1 ? "badge-ok" : "badge-off"}`}
                      >
                        {category.status === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(category)}
                      >
                        Editar
                      </button>

                      {category.status === 1 ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setToDeactivate(category)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void changeStatus(category, 1)}
                          disabled={changingStatus}
                        >
                          Activar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <h3>{editing ? "Editar categoría" : "Nueva categoría"}</h3>
                <p>
                  {editing
                    ? "Actualice los datos de la categoría."
                    : "Registre una categoría de repuestos."}
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
              <div className="field">
                <label htmlFor="category-name">Nombre *</label>
                <input
                  id="category-name"
                  maxLength={80}
                  value={form.name}
                  onChange={(event) =>
                    setForm((old) => ({ ...old, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="category-description">Descripción</label>
                <textarea
                  id="category-description"
                  maxLength={255}
                  value={form.description}
                  onChange={(event) =>
                    setForm((old) => ({ ...old, description: event.target.value }))
                  }
                />
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
                {saving
                  ? "Guardando..."
                  : editing
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDeactivate && (
        <ConfirmModal
          title="Desactivar categoría"
          message={`¿Desea desactivar la categoría "${toDeactivate.name}"? Si tiene repuestos activos, el sistema no lo permitirá.`}
          confirmLabel="Desactivar"
          busy={changingStatus}
          onConfirm={() => void changeStatus(toDeactivate, 0)}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </div>
  );
}
