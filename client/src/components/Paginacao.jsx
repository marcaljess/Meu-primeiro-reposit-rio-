import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Barra de páginas da grade. Cada botão mostra a faixa de números que abre,
 * porque "01–60" diz mais do que "1" na hora de procurar um número.
 */
export default function Paginacao({ pagina, totalPaginas, tamanho, totalNumeros, onIr }) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i);

  return (
    <nav className="flex items-center gap-2" aria-label="Páginas da grade">
      <button
        type="button"
        className="btn btn-secondary btn-icon shrink-0"
        disabled={pagina === 0}
        aria-label="Página anterior"
        onClick={() => onIr(pagina - 1)}
      >
        <CaretLeft size={14} aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-1 overflow-x-auto">
        {paginas.map((p) => {
          const inicio = p * tamanho + 1;
          const fim = Math.min((p + 1) * tamanho, totalNumeros);
          const atual = p === pagina;
          return (
            <button
              key={p}
              type="button"
              aria-current={atual ? 'page' : undefined}
              aria-label={`Números ${inicio} a ${fim}`}
              onClick={() => onIr(p)}
              className={[
                'shrink-0 rounded-sm px-2 py-1 text-[11px] font-medium tabular-nums transition-colors',
                atual
                  ? 'text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]'
                  : 'text-neutral-400 shadow-[inset_0_0_0_1px_var(--color-divider)] hover:text-ink',
              ].join(' ')}
            >
              {pad(inicio)}–{pad(fim)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-icon shrink-0"
        disabled={pagina === totalPaginas - 1}
        aria-label="Próxima página"
        onClick={() => onIr(pagina + 1)}
      >
        <CaretRight size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}
