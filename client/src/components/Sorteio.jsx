import { Trophy } from '@phosphor-icons/react';
import { formatarDataHora } from '../api';

export default function Sorteio({ ganhador, confirmados, sorteando, onSortear, erro }) {
  return (
    <section className="card">
      <span className="card-title text-[15px]">Sorteio</span>
      <p className="card-body m-0">
        Sorteia apenas entre os <strong className="font-medium text-ink">{confirmados}</strong>{' '}
        {confirmados === 1 ? 'número pago' : 'números pagos'} (pagamento validado).
      </p>

      {ganhador && (
        <div className="mt-2 flex flex-col items-center gap-1 rounded-md bg-neutral-900 p-6 text-center shadow-[inset_0_0_0_1px_var(--color-accent-700)]">
          <Trophy size={20} className="text-accent" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
            Número sorteado
          </span>
          <span className="font-heading text-[56px] font-medium leading-none tabular-nums text-accent-300">
            {String(ganhador.numero).padStart(2, '0')}
          </span>
          <span className="font-heading text-[19px] font-medium text-ink">{ganhador.nome}</span>
          <span className="text-[11px] text-neutral-500">
            Sorteado em {formatarDataHora(ganhador.sorteado_em)}
            {ganhador.participantes ? ` · entre ${ganhador.participantes} números pagos` : ''}
          </span>
        </div>
      )}

      {erro && (
        <p
          className="m-0 rounded-md bg-neutral-900 p-3 text-[13px] text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]"
          role="alert"
        >
          {erro}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={onSortear}
        disabled={sorteando || confirmados === 0}
      >
        {sorteando ? 'Sorteando…' : ganhador ? 'Sortear novamente' : 'Sortear'}
      </button>
    </section>
  );
}
