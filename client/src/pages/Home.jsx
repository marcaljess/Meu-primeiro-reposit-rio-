import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Grade from '../components/Grade.jsx';
import Legenda from '../components/Legenda.jsx';
import ModalReserva from '../components/ModalReserva.jsx';
import ReservaConfirmada from '../components/ReservaConfirmada.jsx';
import { getConfig, getNumeros, formatarMoeda, formatarData } from '../api';

const INTERVALO_ATUALIZACAO = 5000;

export default function Home() {
  const [config, setConfig] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [contadores, setContadores] = useState({ livre: 0, reservado: 0, confirmado: 0 });
  const [selecionados, setSelecionados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reservaFeita, setReservaFeita] = useState(null);

  const carregarNumeros = useCallback(async () => {
    const dados = await getNumeros();
    setNumeros(dados.numeros);
    setContadores(dados.contadores);
    // Remove da seleção qualquer número que outra pessoa tenha pego enquanto isso.
    const livres = new Set(dados.numeros.filter((n) => n.status === 'livre').map((n) => n.numero));
    setSelecionados((atuais) => atuais.filter((n) => livres.has(n)));
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [cfg] = await Promise.all([getConfig(), carregarNumeros()]);
        if (ativo) setConfig(cfg);
      } catch (e) {
        if (ativo) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [carregarNumeros]);

  // Polling: mantém a grade sincronizada com o backend.
  useEffect(() => {
    const timer = setInterval(() => {
      if (modalAberto || reservaFeita) return;
      Promise.all([getConfig().then(setConfig), carregarNumeros()]).catch(() => {});
    }, INTERVALO_ATUALIZACAO);
    return () => clearInterval(timer);
  }, [carregarNumeros, modalAberto, reservaFeita]);

  function alternar(numero) {
    setSelecionados((atuais) =>
      atuais.includes(numero) ? atuais.filter((n) => n !== numero) : [...atuais, numero].sort((a, b) => a - b)
    );
  }

  async function aoReservar(reserva) {
    setModalAberto(false);
    setReservaFeita(reserva);
    setSelecionados([]);
    await carregarNumeros().catch(() => {});
  }

  const total = selecionados.length * (config?.valor_numero ?? 0);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-slate-500">
        Carregando a rifa…
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-xl bg-white p-6 text-center shadow">
          <p className="font-semibold text-red-700">Não foi possível carregar a rifa.</p>
          <p className="mt-1 text-sm text-slate-500">{erro}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-slate-900 px-4 py-6 text-white sm:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{config.titulo}</h1>
          {config.descricao && (
            <p className="mt-2 text-sm text-slate-300 sm:text-base">{config.descricao}</p>
          )}
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-slate-400">Valor por número</dt>
              <dd className="font-semibold">{formatarMoeda(config.valor_numero)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Sorteio</dt>
              <dd className="font-semibold">{formatarData(config.data_sorteio)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Total de números</dt>
              <dd className="font-semibold tabular-nums">{config.total_numeros}</dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <Legenda contadores={contadores} />

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Toque nos números verdes para escolher
          </h2>
          <Grade numeros={numeros} selecionados={selecionados} onToggle={alternar} />
        </section>

        <p className="text-center text-xs text-slate-400">
          A grade atualiza sozinha a cada {INTERVALO_ATUALIZACAO / 1000} segundos.{' '}
          <Link to="/admin" className="underline hover:text-slate-600">
            Área do organizador
          </Link>
        </p>
      </main>

      {selecionados.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-600">
                {selecionados.length} {selecionados.length === 1 ? 'número' : 'números'}:{' '}
                <span className="font-semibold text-slate-900">{selecionados.join(', ')}</span>
              </p>
              <p className="text-lg font-bold text-slate-900">{formatarMoeda(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="shrink-0 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Reservar
            </button>
          </div>
        </div>
      )}

      {modalAberto && (
        <ModalReserva
          numeros={selecionados}
          config={config}
          onFechar={() => setModalAberto(false)}
          onSucesso={aoReservar}
        />
      )}

      {reservaFeita && (
        <ReservaConfirmada reserva={reservaFeita} onFechar={() => setReservaFeita(null)} />
      )}
    </div>
  );
}
