import { useEffect, useState } from 'react';
import { CaretDown, CaretUp, Image as ImagemIcone, Trash } from '@phosphor-icons/react';

const CAMPOS = [
  { nome: 'titulo', rotulo: 'Prêmio / título da rifa', tipo: 'text' },
  { nome: 'chave_pix', rotulo: 'Chave PIX', tipo: 'text' },
  { nome: 'total_numeros', rotulo: 'Total de números', tipo: 'number', min: 1, max: 2000, step: 1 },
  { nome: 'valor_numero', rotulo: 'Valor por número (R$)', tipo: 'number', min: 0, step: '0.01' },
  { nome: 'data_sorteio', rotulo: 'Data do sorteio', tipo: 'date' },
];

export default function FormConfig({ config, onSalvar, onEnviarFoto, onRemoverFoto }) {
  const [form, setForm] = useState(config);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [foto, setFoto] = useState({ enviando: false, erro: null });

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
    <section className="card gap-0 p-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-2 rounded-md p-3 text-left"
      >
        <span className="card-title text-[15px]">Configuração da rifa</span>
        {aberto ? (
          <CaretUp size={14} className="text-neutral-400" aria-hidden="true" />
        ) : (
          <CaretDown size={14} className="text-neutral-400" aria-hidden="true" />
        )}
      </button>

      {aberto && (
        <form onSubmit={enviar} className="flex flex-col gap-3 border-t border-divider p-3">
          {CAMPOS.map((campo) => (
            <div key={campo.nome} className="field">
              <label htmlFor={campo.nome}>{campo.rotulo}</label>
              <input
                id={campo.nome}
                className="input"
                type={campo.tipo}
                min={campo.min}
                max={campo.max}
                step={campo.step}
                required
                value={form[campo.nome] ?? ''}
                onChange={(e) => alterar(campo.nome, e.target.value)}
              />
            </div>
          ))}

          <div className="field">
            <label htmlFor="descricao">Descrição / premiação</label>
            <textarea
              id="descricao"
              className="input"
              rows={3}
              value={form.descricao ?? ''}
              onChange={(e) => alterar('descricao', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="foto">Foto do prêmio</label>

            {config.foto_url ? (
              <div className="flex items-center gap-3">
                <img
                  src={config.foto_url}
                  alt="Foto do prêmio atual"
                  className="h-16 w-24 shrink-0 rounded-md object-cover"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={foto.enviando}
                  onClick={async () => {
                    setFoto({ enviando: true, erro: null });
                    try {
                      await onRemoverFoto();
                      setFoto({ enviando: false, erro: null });
                    } catch (err) {
                      setFoto({ enviando: false, erro: err.message });
                    }
                  }}
                >
                  <Trash size={15} aria-hidden="true" /> Remover
                </button>
              </div>
            ) : (
              <p className="m-0 flex items-center gap-2 text-[12px] text-neutral-500">
                <ImagemIcone size={16} aria-hidden="true" />
                Nenhuma foto ainda. Ela aparece esmaecida atrás do título.
              </p>
            )}

            <input
              id="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={foto.enviando}
              className="input mt-2 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-neutral-800 file:px-3 file:py-1 file:font-body file:text-[12px] file:text-ink"
              onChange={async (e) => {
                const arquivo = e.target.files?.[0];
                e.target.value = '';
                if (!arquivo) return;
                if (arquivo.size > 5 * 1024 * 1024) {
                  setFoto({ enviando: false, erro: 'A imagem passa de 5 MB. Envie uma menor.' });
                  return;
                }
                setFoto({ enviando: true, erro: null });
                try {
                  await onEnviarFoto(arquivo);
                  setFoto({ enviando: false, erro: null });
                } catch (err) {
                  setFoto({ enviando: false, erro: err.message });
                }
              }}
            />
            <p className="m-0 mt-1 text-[11px] text-neutral-500">
              {foto.enviando ? 'Enviando…' : 'JPEG, PNG ou WebP, até 5 MB.'}
            </p>
            {foto.erro && (
              <p
                className="m-0 mt-2 rounded-md bg-neutral-900 p-2 text-[12px] text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]"
                role="alert"
              >
                {foto.erro}
              </p>
            )}
          </div>

          <p className="m-0 text-[11px] text-neutral-500">
            Até 2000 números. Aumentar o total cria novos números livres. Reduzir só é permitido se
            os números acima do novo limite estiverem todos livres.
          </p>

          {mensagem && (
            <p
              role="status"
              className={[
                'm-0 rounded-md bg-neutral-900 p-3 text-[13px]',
                mensagem.tipo === 'ok'
                  ? 'text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]'
                  : 'text-neutral-200 shadow-[inset_0_0_0_1px_var(--color-neutral-600)]',
              ].join(' ')}
            >
              {mensagem.texto}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar configuração'}
          </button>
        </form>
      )}
    </section>
  );
}
