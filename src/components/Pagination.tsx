interface PaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const LIMITS = [10, 20, 50];

export default function Pagination({
  page,
  totalPages,
  limit,
  total,
  disabled = false,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <label className="pagination-limit">
        Mostrar
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          {LIMITS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        por página
      </label>

      <span className="pagination-range">
        {first}–{last} de {total}
      </span>

      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>

        <span>
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
