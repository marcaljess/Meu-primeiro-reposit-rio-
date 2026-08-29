import { useEffect, useState } from 'react';

const CAMPOS = [
  { nome: 'titulo', rotulo: 'Título da rifa', tipo: 'text' },
  { nome: 'chave_pix', rotulo: 'Chave PIX', tipo: 'text' },
  { nome: 'total_numeros', rotulo: 'Total de números', tipo: 'number', min: 1, step: 1 },
  { nome: 'valor_numero', rotulo: 'Valor por número (R$)', tipo: 'number', min: 0, step: '0.01' },
  { nome: 'data_sorteio', rotulo: 'Data do sorteio', tipo: 'date' },
];

export default function FormConfig({ config, onSalvar }) {
  const [form, setForm] = useState(config);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => setForm(config), [config]);

  function alterar(nome, valor) {
    setForm((f) => ({ ...f, [nome]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      await onSalvar({
        titulo: form.titulo,
        descricao: form.descricao,
        chave_pix: form.chave_pix,
        data_sorteio: form.data_sorteio,
        total_numeros: Number(form.total_numeros),
        valor_numero: Number(form.valor_numero),
      });
      setMensagem({ tipo: 'ok', texto: 'Configuração salva.' });
    } catch (err) {
      const detalhe = err.numeros?.length ? ` Números: ${err.numeros.join(', ')}` : '';
      setMensagem({ tipo: 'erro', texto: err.message + detalhe });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-base font-bold text-slate-900">Configuração da rifa</span>
        <span className="text-slate-400">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <form onSubmit={enviar} className="space-y-3 border-t border-slate-100 p-4">
          {CAMPOS.map((campo) => (
            <div key={campo.nome}>
              <label htmlFor={campo.nome} className="block text-sm font-medium text-slate-700">
                {campo.rotulo}
              </label>
              <input
                id={campo.nome}
                type={campo.tipo}
                min={campo.min}
                step={campo.step}
                required
                value={form[campo.nome] ?? ''}
                onChange={(e) => alterar(campo.nome, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          ))}

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-700">
              Descrição / premiação
            </label>
            <textarea
              id="descricao"
              rows={3}
              value={form.descricao ?? ''}
              onChange={(e) => alterar('descricao', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <p className="text-xs text-slate-500">
            Aumentar o total cria novos números livres. Reduzir só é permitido se os números acima do
            novo limite estiverem todos livres.
          </p>

          {mensagem && (
            <p
              role="status"
              className={`rounded-lg p-3 text-sm ${
                mensagem.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {mensagem.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar configuração'}
          </button>
        </form>
      )}
    </section>
  );
}
