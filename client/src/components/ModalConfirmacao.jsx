import { useEffect } from 'react';

/**
 * Confirmação desenhada na página. Evita `window.confirm`, que o navegador
 * ignora quando a página está embutida em um iframe sem `allow-modals`.
 */
export default function ModalConfirmacao({
  titulo,
  children,
  rotuloConfirmar = 'Confirmar',
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
      className="dialog-backdrop z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacao"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className="dialog">
        <h2 id="titulo-confirmacao" className="dialog-title">
          {titulo}
        </h2>

        <div className="dialog-body">{children}</div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" autoFocus onClick={onConfirmar}>
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
