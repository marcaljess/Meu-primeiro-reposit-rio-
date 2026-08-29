import { useState } from 'react';
import { formatarDataHora, formatarMoeda } from '../api';

const BADGE = {
  pendente: 'bg-amber-100 text-amber-900',
  paga: 'bg-emerald-100 text-emerald-900',
  cancelada: 'bg-slate-200 text-slate-600',
};

const FILTROS = [
  { chave: 'pendente', rotulo: 'Pendentes' },
  { chave: 'paga', rotulo: 'Pagas' },
  { chave: 'cancelada', rotulo: 'Canceladas' },
  { chave: 'todas', rotulo: 'Todas' },
];

export default function ListaReservas({ reservas, valorNumero, onConfirmar, onLiberar, ocupado }) {
  const [filtro, setFiltro] = useState('pendente');

  const visiveis = filtro === 'todas' ? reservas : reservas.filter((r) => r.status === filtro);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">Reservas</h2>
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => {
            const qtd = f.chave === 'todas' ? reservas.length : reservas.filter((r) => r.status === f.chave).length;
            return (
              <button
                key={f.chave}
                type="button"
                onClick={() => setFiltro(f.chave)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold transition',
                  filtro === f.chave
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {f.rotulo} ({qtd})
              </button>
            );
          })}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nenhuma reserva nesta categoria.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {visiveis.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    #{r.id} — {r.nome}
                  </p>
                  <p className="text-sm text-slate-600">{r.contato}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[r.status]}`}
                >
                  {r.status}
                </span>
              </div>

              <p className="mt-2 flex flex-wrap gap-1">
                {r.numeros.length === 0 ? (
                  <span className="text-sm text-slate-400">sem números</span>
                ) : (
                  r.numeros.map((n) => (
                    <span
                      key={n}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-slate-700"
                    >
                      {n}
                    </span>
                  ))
                )}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {r.numeros.length} × {formatarMoeda(valorNumero)} ={' '}
                <strong className="text-slate-700">
                  {formatarMoeda(r.numeros.length * valorNumero)}
                </strong>{' '}
                · criada em {formatarDataHora(r.criada_em)}
                {r.paga_em && ` · paga em ${formatarDataHora(r.paga_em)}`}
              </p>

              {r.status !== 'cancelada' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === 'pendente' && (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => onConfirmar(r)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Validar pagamento
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => onLiberar(r)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Liberar números
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
