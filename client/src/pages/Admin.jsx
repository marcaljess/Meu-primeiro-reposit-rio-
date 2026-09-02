import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from '@phosphor-icons/react';

import FormConfig from '../components/FormConfig.jsx';
import ListaReservas from '../components/ListaReservas.jsx';
import ModalConfirmacao from '../components/ModalConfirmacao.jsx';
import Sorteio from '../components/Sorteio.jsx';
import {
  atualizarConfig,
  confirmarReserva,
  formatarMoeda,
  getConfig,
  getReservas,
  getSorteios,
  enviarFoto,
  removerFoto,
  liberarReserva,
  login,
  sortear,
} from '../api';

export default function Admin() {
  // A senha vive apenas na memória da página: recarregar exige novo login.
  const [senha, setSenha] = useState(null);

  if (!senha) return <TelaLogin onEntrar={setSenha} />;
  return <Painel senha={senha} onSair={() => setSenha(null)} />;
}

function TelaLogin({ onEntrar }) {
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await login(valor);
      onEntrar(valor);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={enviar} className="card elev-md w-full max-w-sm gap-3 p-4">
        <span className="card-kicker">Área restrita</span>
        <h1 className="m-0 font-heading text-[22px] font-medium text-ink">
          Painel do organizador
        </h1>
        <p className="card-body m-0">Informe a senha para continuar.</p>

        <div className="field mt-2">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            className="input"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        {erro && (
          <p
            className="m-0 rounded-md bg-neutral-900 p-3 text-[13px] text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]"
            role="alert"
          >
            {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <Link to="/" className="mt-2 block text-center text-[12px] text-accent-300">
          Voltar para a rifa
        </Link>
      </form>
    </main>
  );
}

function Painel({ senha, onSair }) {
  const [config, setConfig] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [ganhador, setGanhador] = useState(null);
  const [liberacaoPendente, setLiberacaoPendente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [erroSorteio, setErroSorteio] = useState(null);

  const carregar = useCallback(async () => {
    const [cfg, dados, sorteios] = await Promise.all([
      getConfig(),
      getReservas(senha),
      getSorteios(senha),
    ]);
    setConfig(cfg);
    setReservas(dados.reservas);
    setResumo(dados.resumo);
    if (sorteios.length > 0) setGanhador(sorteios[0]);
  }, [senha]);

  useEffect(() => {
    let ativo = true;
    carregar()
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [carregar]);

  async function executar(acao) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function aoSortear() {
    setOcupado(true);
    setErroSorteio(null);
    try {
      setGanhador(await sortear(senha));
    } catch (e) {
      setErroSorteio(e.message);
    } finally {
      setOcupado(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-neutral-400">
        Carregando painel…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen justify-center px-4 py-8">
      <div className="flex w-full max-w-[560px] flex-col gap-4">
        <header className="nav rounded-md">
          <span className="nav-brand flex min-w-0 items-center gap-2">
            <Ticket size={20} className="shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate">{config?.titulo}</span>
          </span>
          <Link to="/" className="btn btn-secondary shrink-0">
            Ver rifa
          </Link>
          <button type="button" className="btn btn-secondary shrink-0" onClick={onSair}>
            Sair
          </button>
        </header>
        {resumo && <Resumo resumo={resumo} />}

        {erro && (
          <p
            className="m-0 rounded-md bg-neutral-900 p-3 text-[13px] text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-700)]"
            role="alert"
          >
            {erro}
          </p>
        )}

        {config && (
          <FormConfig
            config={config}
            onSalvar={async (payload) => {
              const novo = await atualizarConfig(senha, payload);
              setConfig(novo);
              await carregar();
            }}
            onEnviarFoto={async (arquivo) => setConfig(await enviarFoto(senha, arquivo))}
            onRemoverFoto={async () => setConfig(await removerFoto(senha))}
          />
        )}

        <ListaReservas
          reservas={reservas}
          valorNumero={config?.valor_numero ?? 0}
          ocupado={ocupado}
          onConfirmar={(r) => executar(() => confirmarReserva(senha, r.id))}
          onLiberar={setLiberacaoPendente}
        />

        <Sorteio
          ganhador={ganhador}
          confirmados={resumo?.confirmado ?? 0}
          sorteando={ocupado}
          erro={erroSorteio}
          onSortear={aoSortear}
        />
      </div>

      {liberacaoPendente && (
        <ModalConfirmacao
          titulo={`Liberar números da reserva #${liberacaoPendente.id}?`}
          rotuloConfirmar="Liberar números"
          onCancelar={() => setLiberacaoPendente(null)}
          onConfirmar={() => {
            const alvo = liberacaoPendente;
            setLiberacaoPendente(null);
            executar(() => liberarReserva(senha, alvo.id));
          }}
        >
          <p>
            {liberacaoPendente.status === 'paga' ? (
              <>
                Esta reserva está <strong>paga</strong>. Liberar cancela a reserva de{' '}
                <strong>{liberacaoPendente.nome}</strong> e devolve os números para livre — o valor
                deixa de contar no total arrecadado.
              </>
            ) : (
              <>
                A reserva de <strong>{liberacaoPendente.nome}</strong> será cancelada e os números
                voltam a ficar livres para outras pessoas.
              </>
            )}
          </p>
          <p className="mt-3 flex flex-wrap gap-1.5">
            {liberacaoPendente.numeros.map((n) => (
              <span
                key={n}
                className="rounded-sm bg-neutral-800 px-2 py-[2px] text-[13px] font-medium tabular-nums text-neutral-300"
              >
                {n}
              </span>
            ))}
          </p>
        </ModalConfirmacao>
      )}
    </div>
  );
}

function Resumo({ resumo }) {
  const cartoes = [
    { rotulo: 'Livres', valor: resumo.livre },
    { rotulo: 'Aguardando', valor: resumo.reservado },
    { rotulo: 'Pagos', valor: resumo.confirmado },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="card gap-1 p-3 text-center">
            <span className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
              {c.rotulo}
            </span>
            <span className="font-heading text-[24px] font-medium tabular-nums text-ink">
              {c.valor}
            </span>
          </div>
        ))}
      </div>
      <div className="card elev-sm">
        <span className="card-kicker">Total arrecadado</span>
        <span className="font-heading text-[30px] font-medium tabular-nums leading-none text-ink">
          {formatarMoeda(resumo.total_arrecadado)}
        </span>
        <span className="text-[11px] text-neutral-500">
          de {formatarMoeda(resumo.total_potencial)} se todos os {resumo.total_numeros} números
          forem vendidos
        </span>
      </div>
    </section>
  );
}
