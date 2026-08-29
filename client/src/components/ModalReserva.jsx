import { useEffect, useState } from 'react';
import { criarReserva, formatarMoeda } from '../api';

export default function ModalReserva({ numeros, config, onFechar, onSucesso }) {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const total = numeros.length * (config?.valor_numero ?? 0);

  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && !enviando && onFechar();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [enviando, onFechar]);

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const reserva = await criarReserva({ nome: nome.trim(), contato: contato.trim(), numeros });
      onSucesso(reserva);
    } catch (e) {
      setErro({ mensagem: e.message, numeros: e.numeros ?? [] });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-reserva"
      onClick={(e) => e.target === e.currentTarget && !enviando && onFechar()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 id="titulo-reserva" className="text-lg font-bold text-slate-900">
          Confirmar reserva
        </h2>

        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {numeros.length === 1 ? 'Número escolhido' : 'Números escolhidos'}
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {numeros.map((n) => (
              <span
                key={n}
                className="rounded-md bg-slate-900 px-2 py-0.5 text-sm font-bold tabular-nums text-white"
              >
                {n}
              </span>
            ))}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {numeros.length} × {formatarMoeda(config?.valor_numero)} ={' '}
            <strong className="text-slate-900">{formatarMoeda(total)}</strong>
          </p>
        </div>

        <form onSubmit={enviar} className="mt-4 space-y-3">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              required
              maxLength={120}
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Maria Silva"
            />
          </div>

          <div>
            <label htmlFor="contato" className="block text-sm font-medium text-slate-700">
              WhatsApp / telefone
            </label>
            <input
              id="contato"
              type="tel"
              required
              maxLength={120}
              inputMode="tel"
              autoComplete="tel"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="(11) 90000-0000"
            />
          </div>

          {erro && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
              <p>{erro.mensagem}</p>
              {erro.numeros.length > 0 && (
                <p className="mt-1 font-semibold">Números indisponíveis: {erro.numeros.join(', ')}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onFechar}
              disabled={enviando}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {enviando ? 'Reservando…' : 'Reservar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
