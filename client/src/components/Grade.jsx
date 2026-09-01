// Estados do número na grade. Nocturne não usa cor semântica saturada: livre é
// só contorno, aguardando pagamento é um cinza cheio e pago é o acento tingido.
const ESTILOS = {
  livre:
    'bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--color-divider)] hover:bg-accent-900 hover:shadow-[inset_0_0_0_1px_var(--color-accent-700)] cursor-pointer',
  reservado: 'bg-neutral-800 text-neutral-500 cursor-not-allowed',
  confirmado: 'bg-accent-800 text-accent-300 cursor-not-allowed',
};

const ROTULOS = {
  livre: 'livre',
  reservado: 'aguardando pagamento',
  confirmado: 'pago',
};

export default function Grade({ numeros, selecionados, onToggle }) {
  const selecao = new Set(selecionados);

  return (
    <div
      className="grid grid-cols-6 gap-2"
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
              'flex aspect-square items-center justify-center rounded-sm border-0 p-0',
              'font-body text-[13px] font-medium tabular-nums transition-[background-color,color,box-shadow] duration-150',
              escolhido
                ? 'bg-accent-700 text-accent-100 shadow-[inset_0_0_0_1px_var(--color-accent)]'
                : ESTILOS[status],
            ].join(' ')}
          >
            {String(numero).padStart(2, '0')}
          </button>
        );
      })}
    </div>
  );
}
