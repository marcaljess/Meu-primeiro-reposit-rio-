const ESTILOS = {
  livre: 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 cursor-pointer',
  reservado: 'bg-amber-400 text-amber-950 cursor-not-allowed',
  confirmado: 'bg-red-500 text-white cursor-not-allowed',
};

const ROTULOS = {
  livre: 'livre',
  reservado: 'reservado (aguardando pagamento)',
  confirmado: 'confirmado (pago)',
};

export default function Grade({ numeros, selecionados, onToggle }) {
  const selecao = new Set(selecionados);

  return (
    <div
      className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2 md:grid-cols-10"
      role="group"
      aria-label="Grade de números da rifa"
    >
      {numeros.map(({ numero, status }) => {
        const escolhido = selecao.has(numero);
        const livre = status === 'livre';
        return (
          <button
            key={numero}
            type="button"
            disabled={!livre}
            aria-pressed={escolhido}
            aria-label={`Número ${numero}: ${escolhido ? 'selecionado' : ROTULOS[status]}`}
            onClick={() => livre && onToggle(numero)}
            className={[
              'flex aspect-square items-center justify-center rounded-lg text-sm font-bold tabular-nums',
              'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
              escolhido
                ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2'
                : ESTILOS[status],
            ].join(' ')}
          >
            {numero}
          </button>
        );
      })}
    </div>
  );
}
