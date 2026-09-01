import { useState } from 'react';
import { SealCheck, Copy, Check } from '@phosphor-icons/react';
import { formatarMoeda } from '../api';

export default function ReservaConfirmada({ reserva, onFechar }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(reserva.chave_pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div
      className="dialog-backdrop z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmada"
    >
      <div className="dialog">
        <div className="flex items-center gap-2">
          <SealCheck size={22} weight="fill" className="text-accent" aria-hidden="true" />
          <h2 id="titulo-confirmada" className="dialog-title">
            Números reservados
          </h2>
        </div>

        <p className="dialog-body m-0">
          Reserva <strong className="font-medium text-ink">#{reserva.id}</strong> em nome de{' '}
          <strong className="font-medium text-ink">{reserva.nome}</strong>. Seus números ficam
          guardados como <em>aguardando pagamento</em> até o organizador confirmar.
        </p>

        <p className="flex flex-wrap gap-1">
          {reserva.numeros.map((n) => (
            <span
              key={n}
              className="rounded-sm bg-neutral-800 px-2 py-[2px] text-[13px] font-medium tabular-nums text-neutral-300"
            >
              {String(n).padStart(2, '0')}
            </span>
          ))}
        </p>

        <div className="flex flex-col gap-2 rounded-md bg-neutral-900 p-4">
          <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-400">
            Valor total
          </span>
          <span className="font-heading text-[28px] font-medium tabular-nums leading-none text-ink">
            {formatarMoeda(reserva.total)}
          </span>

          <span className="mt-3 text-[10px] uppercase tracking-[0.1em] text-neutral-400">
            Chave PIX
          </span>
          <span className="break-all text-[15px] font-medium text-accent-300">
            {reserva.chave_pix}
          </span>

          <button type="button" className="btn btn-primary btn-block" onClick={copiarPix}>
            {copiado ? (
              <>
                <Check size={15} aria-hidden="true" /> Chave copiada
              </>
            ) : (
              <>
                <Copy size={15} aria-hidden="true" /> Copiar chave PIX
              </>
            )}
          </button>
        </div>

        <p className="m-0 rounded-md bg-neutral-900 p-3 text-[13px] leading-relaxed text-neutral-300 shadow-[inset_0_0_0_1px_var(--color-accent-800)]">
          Faça o PIX de <strong className="font-medium text-ink">{formatarMoeda(reserva.total)}</strong>{' '}
          e envie o comprovante ao organizador pelo WhatsApp, junto com o código{' '}
          <strong className="font-medium text-ink">#{reserva.id}</strong>. Assim que ele validar, seus
          números passam a constar como <strong className="font-medium text-ink">pagos</strong> e
          entram no sorteio.
        </p>

        <button type="button" className="btn btn-secondary btn-block" onClick={onFechar}>
          Voltar para a rifa
        </button>
      </div>
    </div>
  );
}
