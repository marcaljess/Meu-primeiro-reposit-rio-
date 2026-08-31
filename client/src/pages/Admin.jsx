import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
      <form onSubmit={enviar} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900">Painel do organizador</h1>
        <p className="mt-1 text-sm text-slate-500">Informe a senha para continuar.</p>

        <label htmlFor="senha" className="mt-5 block text-sm font-medium text-slate-700">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />

        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 underline">
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
      <main className="flex min-h-screen items-center justify-center p-6 text-slate-500">
        Carregando painel…
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 px-4 py-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">Painel do organizador</h1>
            <p className="truncate text-sm text-slate-400">{config?.titulo}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to="/"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Ver rifa
            </Link>
            <button
              type="button"
              onClick={onSair}
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {resumo && <Resumo resumo={resumo} />}

        {erro && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
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
      </main>

      {liberacaoPendente && (
        <ModalConfirmacao
          titulo={`Liberar números da reserva #${liberacaoPendente.id}?`}
          rotuloConfirmar="Liberar números"
          destrutivo
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
                className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-700"
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
    { rotulo: 'Livres', valor: resumo.livre, cor: 'text-emerald-600' },
    { rotulo: 'Reservados', valor: resumo.reservado, cor: 'text-amber-600' },
    { rotulo: 'Confirmados', valor: resumo.confirmado, cor: 'text-red-600' },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-500">{c.rotulo}</p>
            <p className={`text-2xl font-bold tabular-nums ${c.cor}`}>{c.valor}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Total arrecadado (números confirmados)
        </p>
        <p className="text-3xl font-bold text-slate-900">{formatarMoeda(resumo.total_arrecadado)}</p>
        <p className="mt-1 text-xs text-slate-500">
          de {formatarMoeda(resumo.total_potencial)} se todos os {resumo.total_numeros} números
          forem vendidos
        </p>
      </div>
    </section>
  );
}
