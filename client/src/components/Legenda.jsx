export default function Legenda({ contadores }) {
  const itens = [
    { chave: 'livre', rotulo: 'Livres', cor: 'bg-emerald-500' },
    { chave: 'reservado', rotulo: 'Reservados', cor: 'bg-amber-400' },
    { chave: 'confirmado', rotulo: 'Confirmados', cor: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {itens.map((item) => (
        <div
          key={item.chave}
          className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${item.cor}`} aria-hidden="true" />
            <span className="text-xs font-medium text-slate-500 sm:text-sm">{item.rotulo}</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {contadores?.[item.chave] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
