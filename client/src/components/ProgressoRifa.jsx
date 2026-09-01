import { formatarMoeda, formatarData } from '../api';

/**
 * Herói da rifa: prêmio, progresso de vendas e as duas informações que a
 * pessoa checa antes de decidir (valor do número e data do sorteio).
 */
export default function ProgressoRifa({ config, contadores }) {
  const vendidos = (contadores?.reservado ?? 0) + (contadores?.confirmado ?? 0);
  const total = config.total_numeros || 1;
  const pct = Math.round((vendidos / total) * 100);

  return (
    <section className="card elev-md overflow-hidden p-0">
      <div className="flex min-h-[132px] flex-col justify-end bg-[linear-gradient(160deg,var(--color-neutral-800),var(--color-surface))] p-4 sm:min-h-[168px]">
        <span className="card-kicker m-0">Prêmio</span>
        <h1 className="mt-1 font-heading text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-ink [text-wrap:pretty]">
          {config.titulo}
        </h1>
        {config.descricao && (
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
            {config.descricao}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-divider p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] tabular-nums text-neutral-400">
            {vendidos} de {config.total_numeros} números vendidos
          </span>
          <span className="text-[13px] font-medium tabular-nums text-accent-300">{pct}%</span>
        </div>

        <div
          className="h-[5px] overflow-hidden rounded-sm bg-neutral-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso das vendas"
        >
          <div
            className="h-full rounded-sm bg-[linear-gradient(90deg,var(--color-accent-700),var(--color-accent))]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums text-neutral-400">
          <span>{formatarMoeda(config.valor_numero)} por número</span>
          <span>Sorteio {formatarData(config.data_sorteio)}</span>
        </div>
      </div>
    </section>
  );
}
