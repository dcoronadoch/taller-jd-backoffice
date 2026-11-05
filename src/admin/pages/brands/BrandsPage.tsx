import { useEffect, useState, type FormEvent } from "react";
import {
  createBrand,
  getBrands,
  updateBrand,
  updateBrandStatus,
  type BrandRecord,
} from "../../../services/brands.service";
import { errorMessage } from "../../../services/http";
import ConfirmModal from "../../../components/ConfirmModal";
import "../../../css/users.css";
import "../../../css/parts.css";

const dateFormat = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Formulario (crear / editar)
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BrandRecord | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmación para desactivar
  const [toDeactivate, setToDeactivate] = useState<BrandRecord | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getBrands();
        if (!cancelled) setBrands(result);
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "No fue posible cargar las marcas."));
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
    setName("");
    setFormError("");
    setShowModal(true);
  }

  function openEdit(brand: BrandRecord) {
    setEditing(brand);
    setName(brand.name);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditing(null);
    setName("");
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const value = name.trim();

    if (!value) {
      setFormError("Ingrese el nombre de la marca.");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateBrand(editing.id, value);
        setNotice("Marca actualizada correctamente.");
      } else {
        await createBrand(value);
        setNotice("Marca creada correctamente.");
      }

      setShowModal(false);
      setEditing(null);
      setName("");
      reload();
    } catch (e) {
      setFormError(errorMessage(e, "No fue posible guardar la marca."));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(brand: BrandRecord, next: 0 | 1) {
    setChangingStatus(true);
    setActionError("");

    try {
      await updateBrandStatus(brand.id, next);
      setNotice(
        next === 1
          ? "Marca activada correctamente."
          : "Marca desactivada correctamente."
      );
      setToDeactivate(null);
      reload();
    } catch (e) {
      setToDeactivate(null);
      setActionError(
        errorMessage(e, "No fue posible cambiar el estado de la marca.")
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
          <h2>Marcas</h2>
          <p>Marcas de los repuestos que se venden en el taller.</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nueva marca
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
            <h3>Listado de marcas</h3>
            <p>{brands.length} marca(s) registradas</p>
          </div>
        </div>

        {loading ? (
          <div className="state">Cargando marcas...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : brands.length === 0 ? (
          <div className="state">Aún no hay marcas registradas.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Actualizada</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>{brand.id}</td>
                    <td>{brand.name}</td>
                    <td>
                      <span
                        className={`badge ${brand.status === 1 ? "badge-ok" : "badge-off"}`}
                      >
                        {brand.status === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>{formatDate(brand.updated_at)}</td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(brand)}
                      >
                        Editar
                      </button>

                      {brand.status === 1 ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setToDeactivate(brand)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void changeStatus(brand, 1)}
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
                <h3>{editing ? "Editar marca" : "Nueva marca"}</h3>
                <p>
                  {editing
                    ? "Actualice el nombre de la marca."
                    : "Registre una marca de repuestos."}
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
                <label htmlFor="brand-name">Nombre *</label>
                <input
                  id="brand-name"
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
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
                    : "Crear marca"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDeactivate && (
        <ConfirmModal
          title="Desactivar marca"
          message={`¿Desea desactivar la marca "${toDeactivate.name}"? Si tiene repuestos activos, el sistema no lo permitirá.`}
          confirmLabel="Desactivar"
          busy={changingStatus}
          onConfirm={() => void changeStatus(toDeactivate, 0)}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </div>
  );
}
