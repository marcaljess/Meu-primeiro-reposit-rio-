import { LockKey, Receipt, ListMagnifyingGlass } from '@phosphor-icons/react';

/**
 * "Por que você pode confiar". Cada item aqui é uma afirmação que o sistema
 * realmente cumpre — nada de selo que o código não sustenta.
 */
const ITENS = [
  {
    Icone: LockKey,
    texto:
      'Nome e WhatsApp são usados apenas para identificar a sua reserva, conforme a LGPD. Não aparecem nesta página nem são compartilhados com terceiros.',
  },
  {
    Icone: Receipt,
    texto:
      'Você recebe o código da reserva na hora de reservar, para conferir com o organizador.',
  },
  {
    Icone: ListMagnifyingGlass,
    texto:
      'A grade acima mostra quais números já foram pagos, aberta para consulta até o dia do sorteio.',
  },
];

export default function CardConfianca() {
  return (
    <section className="card">
      <span className="card-kicker">Por que você pode confiar</span>
      {ITENS.map(({ Icone, texto }) => (
        <div key={texto} className="flex gap-3">
          <Icone size={17} className="shrink-0 text-accent" aria-hidden="true" />
          <p className="card-body m-0">{texto}</p>
        </div>
      ))}
    </section>
  );
}
