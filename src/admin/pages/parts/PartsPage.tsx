import { useEffect, useState, type FormEvent } from "react";
import {
  createPart,
  getParts,
  updatePart,
  updatePartStatus,
  type PartInput,
  type PartRecord,
} from "../../../services/parts.service";
import { getBrands, type BrandRecord } from "../../../services/brands.service";
import {
  getCategories,
  type CategoryRecord,
} from "../../../services/categories.service";
import { errorMessage } from "../../../services/http";
import ConfirmModal from "../../../components/ConfirmModal";
import Pagination from "../../../components/Pagination";
import PartImagesModal from "./PartImagesModal";
import "../../../css/users.css";
import "../../../css/parts.css";

type FormState = {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  brand_id: string;
  category_id: string;
  status: number;
};

const emptyForm: FormState = {
  sku: "",
  name: "",
  description: "",
  price: "",
  stock: "0",
  brand_id: "",
  category_id: "",
  status: 1,
};

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
});

export default function PartsPage() {
  // Listado
  const [parts, setParts] = useState<PartRecord[]>([]);
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  // Paginación, búsqueda y filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Formulario (crear / editar)
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PartRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmación para desactivar e imágenes
  const [toDeactivate, setToDeactivate] = useState<PartRecord | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [imagesPart, setImagesPart] = useState<PartRecord | null>(null);

  // Marcas y categorías para los filtros y el formulario (una sola vez).
  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch((e) => setError(errorMessage(e, "No fue posible cargar las marcas.")));

    getCategories()
      .then(setCategories)
      .catch((e) =>
        setError(errorMessage(e, "No fue posible cargar las categorías."))
      );
  }, []);

  // Carga la lista cuando cambia cualquier filtro, la página o se pide recargar.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getParts({
          page,
          limit,
          search: query,
          brandId: brandFilter,
          categoryId: categoryFilter,
          status: statusFilter,
        });

        if (cancelled) return;

        setParts(result.data);
        setTotal(result.pagination.total);
        setTotalPages(Math.max(1, result.pagination.totalPages));
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "No fue posible cargar los repuestos."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [page, limit, query, brandFilter, categoryFilter, statusFilter, reloadKey]);

  function reload() {
    setReloadKey((key) => key + 1);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(part: PartRecord) {
    setEditing(part);
    setForm({
      sku: part.sku,
      name: part.name,
      description: part.description ?? "",
      price: String(part.price),
      stock: String(part.stock),
      brand_id: String(part.brand_id),
      category_id: String(part.category_id),
      status: part.status,
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

    const sku = form.sku.trim().toUpperCase();
    const name = form.name.trim();
    const priceText = form.price.trim().replace(",", ".");
    const stockText = form.stock.trim();
    const price = Number(priceText);
    const stock = Number(stockText);

    if (!sku) {
      setFormError("Ingrese el SKU del repuesto.");
      return;
    }

    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(sku)) {
      setFormError(
        "El SKU solo puede contener letras, números, punto, guion y guion bajo."
      );
      return;
    }

    if (!name) {
      setFormError("Ingrese el nombre del repuesto.");
      return;
    }

    if (!form.brand_id) {
      setFormError("Seleccione una marca.");
      return;
    }

    if (!form.category_id) {
      setFormError("Seleccione una categoría.");
      return;
    }

    if (
      priceText === "" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      Math.round(price * 100) / 100 !== price
    ) {
      setFormError("El precio debe ser mayor que 0 y tener máximo 2 decimales.");
      return;
    }

    if (stockText === "" || !Number.isInteger(stock) || stock < 0) {
      setFormError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    // El backend reemplaza todos los campos en un PUT: se envían completos.
    const input: PartInput = {
      sku,
      name,
      description: form.description.trim() || null,
      price,
      stock,
      brand_id: Number(form.brand_id),
      category_id: Number(form.category_id),
      status: form.status,
    };

    setSaving(true);

    try {
      if (editing) {
        await updatePart(editing.id, input);
        setNotice("Repuesto actualizado correctamente.");
      } else {
        await createPart(input);
        setNotice("Repuesto creado correctamente.");
        setPage(1);
      }

      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      reload();
    } catch (e) {
      setFormError(errorMessage(e, "No fue posible guardar el repuesto."));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(part: PartRecord, next: 0 | 1) {
    setChangingStatus(true);
    setActionError("");

    try {
      await updatePartStatus(part.id, next);
      setNotice(
        next === 1
          ? "Repuesto activado correctamente."
          : "Repuesto desactivado correctamente."
      );
      setToDeactivate(null);
      reload();
    } catch (e) {
      setToDeactivate(null);
      setActionError(
        errorMessage(e, "No fue posible cambiar el estado del repuesto.")
      );
    } finally {
      setChangingStatus(false);
    }
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(search.trim());
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setQuery("");
    setBrandFilter("");
    setCategoryFilter("");
    setStatusFilter("");
    setPage(1);
  }

  const hasFilters = !!(query || brandFilter || categoryFilter || statusFilter);

  // El formulario solo ofrece marcas y categorías activas; si el repuesto
  // que se edita conserva una inactiva, también se muestra.
  const brandOptions = brands.filter(
    (b) => b.status === 1 || b.id === editing?.brand_id
  );
  const categoryOptions = categories.filter(
    (c) => c.status === 1 || c.id === editing?.category_id
  );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">INVENTARIO</span>
          <h2>Repuestos</h2>
          <p>Gestione el catálogo de repuestos de Taller y Repuestos JD.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={brandOptions.length === 0 || categoryOptions.length === 0}
          title={
            brandOptions.length === 0 || categoryOptions.length === 0
              ? "Cree primero al menos una marca y una categoría activas"
              : undefined
          }
        >
          + Nuevo repuesto
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
            <h3>Listado de repuestos</h3>
            <p>{total} repuesto(s) encontrados</p>
          </div>

          <form className="search" onSubmit={onSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o SKU"
              aria-label="Buscar repuestos"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Buscar
            </button>
          </form>
        </div>

        <div className="filters">
          <select
            value={brandFilter}
            onChange={(event) => {
              setBrandFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por marca"
          >
            <option value="">Todas las marcas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="state">Cargando repuestos...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : parts.length === 0 ? (
          <div className="state">No se encontraron repuestos.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Repuesto</th>
                  <th>Marca</th>
                  <th>Categoría</th>
                  <th className="num">Precio</th>
                  <th className="num">Stock</th>
                  <th>Estado</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td>
                      {part.image_url ? (
                        <img
                          className="thumb"
                          src={part.image_url}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="thumb-empty" aria-hidden="true">
                          🛞
                        </div>
                      )}
                    </td>
                    <td className="cell-main">
                      <strong>{part.name}</strong>
                      <small>SKU: {part.sku}</small>
                    </td>
                    <td>{part.brand}</td>
                    <td>{part.category}</td>
                    <td className="num">{money.format(part.price)}</td>
                    <td className="num">
                      <span className={part.stock === 0 ? "stock-low" : undefined}>
                        {part.stock}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${part.status === 1 ? "badge-ok" : "badge-off"}`}
                      >
                        {part.status === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(part)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setImagesPart(part)}
                      >
                        Imágenes
                      </button>

                      {part.status === 1 ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setToDeactivate(part)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void changeStatus(part, 1)}
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
            className="modal modal-wide"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
            noValidate
          >
            <div className="modal-head">
              <div>
                <h3>{editing ? "Editar repuesto" : "Nuevo repuesto"}</h3>
                <p>
                  {editing
                    ? "Actualice los datos del repuesto."
                    : "Registre un repuesto en el catálogo."}
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
                <div className="field">
                  <label htmlFor="part-sku">SKU *</label>
                  <input
                    id="part-sku"
                    maxLength={40}
                    value={form.sku}
                    onChange={(event) => updateField("sku", event.target.value)}
                    placeholder="FR-001"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="part-name">Nombre *</label>
                  <input
                    id="part-name"
                    maxLength={150}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="part-brand">Marca *</label>
                  <select
                    id="part-brand"
                    value={form.brand_id}
                    onChange={(event) => updateField("brand_id", event.target.value)}
                    required
                  >
                    <option value="">Seleccione una marca</option>
                    {brandOptions.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                        {brand.status === 0 ? " (inactiva)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="part-category">Categoría *</label>
                  <select
                    id="part-category"
                    value={form.category_id}
                    onChange={(event) =>
                      updateField("category_id", event.target.value)
                    }
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {category.status === 0 ? " (inactiva)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="part-price">Precio (₡) *</label>
                  <input
                    id="part-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="part-stock">Stock *</label>
                  <input
                    id="part-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) => updateField("stock", event.target.value)}
                    required
                  />
                </div>

                <div className="field span-2">
                  <label htmlFor="part-description">Descripción</label>
                  <textarea
                    id="part-description"
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </div>

                {editing && (
                  <div className="field">
                    <label htmlFor="part-status">Estado</label>
                    <select
                      id="part-status"
                      value={form.status}
                      onChange={(event) =>
                        updateField("status", Number(event.target.value))
                      }
                    >
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                )}
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
                    : "Crear repuesto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDeactivate && (
        <ConfirmModal
          title="Desactivar repuesto"
          message={`¿Desea desactivar "${toDeactivate.name}" (${toDeactivate.sku})? Dejará de estar disponible en el catálogo, pero no se borra de la base de datos.`}
          confirmLabel="Desactivar"
          busy={changingStatus}
          onConfirm={() => void changeStatus(toDeactivate, 0)}
          onCancel={() => setToDeactivate(null)}
        />
      )}

      {imagesPart && (
        <PartImagesModal
          part={imagesPart}
          onClose={() => setImagesPart(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
