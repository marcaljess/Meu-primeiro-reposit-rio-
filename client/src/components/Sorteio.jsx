import { formatarDataHora } from '../api';

export default function Sorteio({ ganhador, confirmados, sorteando, onSortear, erro }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">Sorteio</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sorteia apenas entre os <strong>{confirmados}</strong>{' '}
        {confirmados === 1 ? 'número confirmado' : 'números confirmados'} (pagamento validado).
      </p>

      {ganhador && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-5 text-center text-amber-950 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-widest">Número sorteado</p>
          <p className="text-6xl font-black tabular-nums leading-tight">{ganhador.numero}</p>
          <p className="mt-1 text-xl font-bold">{ganhador.nome}</p>
          <p className="mt-2 text-xs opacity-80">
            Sorteado em {formatarDataHora(ganhador.sorteado_em)}
            {ganhador.participantes ? ` · entre ${ganhador.participantes} números confirmados` : ''}
          </p>
        </div>
      )}

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={onSortear}
        disabled={sorteando || confirmados === 0}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sorteando ? 'Sorteando…' : ganhador ? 'Sortear novamente' : 'Sortear'}
      </button>
    </section>
  );
}
