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
      className="dialog-backdrop z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-reserva"
      onClick={(e) => e.target === e.currentTarget && !enviando && onFechar()}
    >
      <form onSubmit={enviar} className="dialog">
        <h2 id="titulo-reserva" className="dialog-title">
          Confirmar reserva
        </h2>

        <div className="flex flex-col gap-2 rounded-md bg-neutral-900 p-3">
          <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-400">
            {numeros.length === 1 ? 'Número escolhido' : 'Números escolhidos'}
          </span>
          <p className="flex flex-wrap gap-1">
            {numeros.map((n) => (
              <span
                key={n}
                className="rounded-sm bg-accent-800 px-2 py-[2px] text-[13px] font-medium tabular-nums text-accent-100"
              >
                {String(n).padStart(2, '0')}
              </span>
            ))}
          </p>
          <p className="m-0 text-[13px] text-neutral-400">
            {numeros.length} × {formatarMoeda(config?.valor_numero)} ={' '}
            <strong className="font-medium text-ink">{formatarMoeda(total)}</strong>
          </p>
        </div>

        <div className="field">
          <label htmlFor="nome">Seu nome</label>
          <input
            id="nome"
            className="input"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Maria Silva"
          />
        </div>

        <div className="field">
          <label htmlFor="contato">WhatsApp / telefone</label>
          <input
            id="contato"
            className="input"
            type="tel"
            required
            maxLength={120}
            inputMode="tel"
            autoComplete="tel"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            placeholder="(11) 90000-0000"
          />
        </div>

        {erro && (
          <div
            className="rounded-md bg-neutral-900 p-3 text-[13px] text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]"
            role="alert"
          >
            <p className="m-0">{erro.mensagem}</p>
            {erro.numeros.length > 0 && (
              <p className="m-0 mt-1 font-medium">
                Números indisponíveis: {erro.numeros.map((n) => String(n).padStart(2, '0')).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onFechar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Reservando…' : 'Reservar'}
          </button>
        </div>
      </form>
    </div>
  );
}
