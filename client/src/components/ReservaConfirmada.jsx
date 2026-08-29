import { useState } from 'react';
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
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmada"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg">
            ✓
          </span>
          <h2 id="titulo-confirmada" className="text-lg font-bold text-slate-900">
            Números reservados!
          </h2>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Reserva <strong>#{reserva.id}</strong> em nome de <strong>{reserva.nome}</strong>. Seus
          números ficam guardados como <em>reservados</em> até o organizador confirmar o pagamento.
        </p>

        <p className="mt-3 flex flex-wrap gap-1.5">
          {reserva.numeros.map((n) => (
            <span
              key={n}
              className="rounded-md bg-amber-400 px-2 py-0.5 text-sm font-bold tabular-nums text-amber-950"
            >
              {n}
            </span>
          ))}
        </p>

        <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor total</p>
          <p className="text-3xl font-bold text-slate-900">{formatarMoeda(reserva.total)}</p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Chave PIX
          </p>
          <p className="break-all text-base font-semibold text-slate-900">{reserva.chave_pix}</p>

          <button
            type="button"
            onClick={copiarPix}
            className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            {copiado ? 'Chave copiada!' : 'Copiar chave PIX'}
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Importante:</strong> faça o PIX de {formatarMoeda(reserva.total)} e envie o
          comprovante ao organizador pelo WhatsApp. Assim que ele validar o pagamento, seus números
          passam a ficar <strong>confirmados</strong> e entram no sorteio.
        </p>

        <button
          type="button"
          onClick={onFechar}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Voltar para a rifa
        </button>
      </div>
    </div>
  );
}
