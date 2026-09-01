import { useState } from 'react';
import { formatarDataHora, formatarMoeda } from '../api';

const BADGE = {
  pendente: 'tag tag-neutral',
  paga: 'tag tag-accent',
  cancelada: 'tag tag-outline',
};

const NOME_STATUS = {
  pendente: 'aguardando pagamento',
  paga: 'paga',
  cancelada: 'cancelada',
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
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="card-title text-[15px]">Reservas</span>
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => {
            const qtd =
              f.chave === 'todas'
                ? reservas.length
                : reservas.filter((r) => r.status === f.chave).length;
            const ativo = filtro === f.chave;
            return (
              <button
                key={f.chave}
                type="button"
                onClick={() => setFiltro(f.chave)}
                className={[
                  'rounded-sm px-2 py-1 text-[11px] font-medium tabular-nums transition-colors',
                  ativo
                    ? 'text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]'
                    : 'text-neutral-400 shadow-[inset_0_0_0_1px_var(--color-divider)] hover:text-ink',
                ].join(' ')}
              >
                {f.rotulo} ({qtd})
              </button>
            );
          })}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-neutral-500">
          Nenhuma reserva nesta categoria.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {visiveis.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-md bg-neutral-900 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="m-0 font-heading text-[15px] font-medium text-ink">
                    #{r.id} — {r.nome}
                  </p>
                  <p className="m-0 text-[13px] text-neutral-400">{r.contato}</p>
                </div>
                <span className={BADGE[r.status]}>{NOME_STATUS[r.status]}</span>
              </div>

              <p className="m-0 flex flex-wrap gap-1">
                {r.numeros.length === 0 ? (
                  <span className="text-[13px] text-neutral-500">sem números</span>
                ) : (
                  r.numeros.map((n) => (
                    <span
                      key={n}
                      className="rounded-sm bg-neutral-800 px-[6px] py-[2px] text-[12px] font-medium tabular-nums text-neutral-300"
                    >
                      {String(n).padStart(2, '0')}
                    </span>
                  ))
                )}
              </p>

              <p className="m-0 text-[11px] tabular-nums text-neutral-500">
                {r.numeros.length} × {formatarMoeda(valorNumero)} ={' '}
                <strong className="font-medium text-neutral-300">
                  {formatarMoeda(r.numeros.length * valorNumero)}
                </strong>{' '}
                · criada em {formatarDataHora(r.criada_em)}
                {r.paga_em && ` · paga em ${formatarDataHora(r.paga_em)}`}
              </p>

              {r.status !== 'cancelada' && (
                <div className="flex flex-wrap gap-2">
                  {r.status === 'pendente' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={ocupado}
                      onClick={() => onConfirmar(r)}
                    >
                      Validar pagamento
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={ocupado}
                    onClick={() => onLiberar(r)}
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
