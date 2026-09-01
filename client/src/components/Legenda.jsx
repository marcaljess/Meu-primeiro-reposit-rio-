const ITENS = [
  { chave: 'livre', rotulo: 'Livre', amostra: 'shadow-[inset_0_0_0_1px_var(--color-neutral-600)]' },
  { chave: 'reservado', rotulo: 'Aguardando pagamento', amostra: 'bg-neutral-800' },
  { chave: 'confirmado', rotulo: 'Pago', amostra: 'bg-accent-800' },
];

/** Legenda da grade: uma linha de amostras, não um painel de contadores. */
export default function Legenda({ contadores }) {
  return (
    <div className="flex flex-wrap gap-4">
      {ITENS.map((item) => (
        <span
          key={item.chave}
          className="flex items-center gap-1 text-[11px] text-neutral-400"
        >
          <span className={`h-[9px] w-[9px] rounded-[2px] ${item.amostra}`} aria-hidden="true" />
          {item.rotulo}
          {contadores && (
            <span className="tabular-nums text-neutral-500">
              ({contadores[item.chave] ?? 0})
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
