import { useEffect } from 'react';

/**
 * Confirmação desenhada na página. Evita `window.confirm`, que o navegador
 * ignora quando a página está embutida em um iframe sem `allow-modals`.
 */
export default function ModalConfirmacao({
  titulo,
  children,
  rotuloConfirmar = 'Confirmar',
  destrutivo = false,
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onCancelar();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onCancelar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacao"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 id="titulo-confirmacao" className="text-lg font-bold text-slate-900">
          {titulo}
        </h2>

        <div className="mt-2 text-sm text-slate-600">{children}</div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirmar}
            className={[
              'flex-1 rounded-lg px-4 py-3 font-semibold text-white transition',
              destrutivo ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800',
            ].join(' ')}
          >
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
