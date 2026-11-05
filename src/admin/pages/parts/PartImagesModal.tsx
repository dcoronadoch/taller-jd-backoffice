import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  addPartImage,
  deletePartImage,
  getPart,
  setPrimaryImage,
  type PartDetail,
  type PartImage,
  type PartRecord,
} from "../../../services/parts.service";
import { errorMessage } from "../../../services/http";
import ConfirmModal from "../../../components/ConfirmModal";
import "../../../css/users.css";
import "../../../css/parts.css";

interface PartImagesModalProps {
  part: PartRecord;
  onClose: () => void;
  // Se llama después de cada cambio para refrescar la lista de repuestos.
  onChanged: () => void;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function PartImagesModal({
  part,
  onClose,
  onChanged,
}: PartImagesModalProps) {
  const [detail, setDetail] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [url, setUrl] = useState("");
  const [primary, setPrimary] = useState(false);
  const [toDelete, setToDelete] = useState<PartImage | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDetail(await getPart(part.id));
    } catch (e) {
      setError(errorMessage(e, "No fue posible cargar las imágenes."));
    } finally {
      setLoading(false);
    }
  }, [part.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy && !toDelete) onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, toDelete, onClose]);

  // Ejecuta una operación contra la API y refresca los datos.
  async function run(action: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    setError("");

    try {
      await action();
      await refresh();
      onChanged();
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = url.trim();

    if (!isValidUrl(text)) {
      setError("Ingrese una URL válida que inicie con http:// o https://.");
      return;
    }

    void run(async () => {
      await addPartImage(part.id, {
        url: text,
        is_primary: primary,
        sort_order: detail?.images.length ?? 0,
      });
      setUrl("");
      setPrimary(false);
    }, "No fue posible agregar la imagen.");
  }

  async function confirmDelete() {
    if (!toDelete) return;

    const image = toDelete;
    setToDelete(null);

    await run(
      () => deletePartImage(part.id, image.id),
      "No fue posible eliminar la imagen."
    );
  }

  const images = detail?.images ?? [];

  return (
    <>
      <div className="modal-overlay" onMouseDown={() => !busy && onClose()}>
        <div
          className="modal modal-wide"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-head">
            <div>
              <h3>Imágenes del repuesto</h3>
              <p>
                {part.sku} · {part.name}
              </p>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
              disabled={busy}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="state">Cargando imágenes...</div>
            ) : images.length === 0 ? (
              <div className="state">Este repuesto aún no tiene imágenes.</div>
            ) : (
              <div className="image-grid">
                {images.map((image) => (
                  <div className="image-card" key={image.id}>
                    <img
                      src={image.url}
                      alt={`Imagen de ${part.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    {image.is_primary === 1 && (
                      <span className="badge badge-ok">Principal</span>
                    )}

                    <div className="image-actions">
                      {image.is_primary !== 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busy}
                          onClick={() =>
                            void run(
                              () => setPrimaryImage(part.id, image.id),
                              "No fue posible cambiar la imagen principal."
                            )
                          }
                        >
                          Hacer principal
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => setToDelete(image)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className="add-image" onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="image-url">Agregar imagen por URL</label>
                <input
                  id="image-url"
                  type="url"
                  maxLength={500}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <small>Máximo 10 imágenes por repuesto.</small>
              </div>

              <div className="field field-check">
                <input
                  id="image-primary"
                  type="checkbox"
                  checked={primary}
                  onChange={(event) => setPrimary(event.target.checked)}
                />
                <label htmlFor="image-primary">Usar como imagen principal</label>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-foot" style={{ padding: "4px 0 18px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={busy}
                >
                  Cerrar
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Procesando..." : "Agregar imagen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmModal
          title="Eliminar imagen"
          message="¿Desea eliminar esta imagen del repuesto? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
