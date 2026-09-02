import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from '@phosphor-icons/react';

import Grade from '../components/Grade.jsx';
import Legenda from '../components/Legenda.jsx';
import Paginacao from '../components/Paginacao.jsx';
import ProgressoRifa from '../components/ProgressoRifa.jsx';
import CardConfianca from '../components/CardConfianca.jsx';
import ModalReserva from '../components/ModalReserva.jsx';
import ReservaConfirmada from '../components/ReservaConfirmada.jsx';
import { getConfig, getNumeros, formatarMoeda } from '../api';

const INTERVALO_ATUALIZACAO = 5000;
const ATALHOS = [5, 10, 20];
const NUMEROS_POR_PAGINA = 60;

export default function Home() {
  const [config, setConfig] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [contadores, setContadores] = useState({ livre: 0, reservado: 0, confirmado: 0 });
  const [selecionados, setSelecionados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reservaFeita, setReservaFeita] = useState(null);
  const [pagina, setPagina] = useState(0);

  const carregarNumeros = useCallback(async () => {
    const dados = await getNumeros();
    setNumeros(dados.numeros);
    setContadores(dados.contadores);
    // Tira da seleção qualquer número que outra pessoa tenha pego enquanto isso.
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
      atuais.includes(numero)
        ? atuais.filter((n) => n !== numero)
        : [...atuais, numero].sort((a, b) => a - b)
    );
  }

  /** Escolha rápida: distribui a quantidade pedida entre os números livres. */
  function escolhaRapida(quantidade) {
    const livres = numeros.filter((n) => n.status === 'livre').map((n) => n.numero);
    const passo = Math.max(1, Math.floor(livres.length / quantidade));
    const escolhidos = [];
    for (let i = 0; i < livres.length && escolhidos.length < quantidade; i += passo) {
      escolhidos.push(livres[i]);
    }
    const ordenados = escolhidos.sort((a, b) => a - b);
    setSelecionados(ordenados);
    // Leva à página do primeiro número escolhido, senão a seleção some da vista.
    if (ordenados.length > 0) {
      const indice = numeros.findIndex((n) => n.numero === ordenados[0]);
      if (indice >= 0) setPagina(Math.floor(indice / NUMEROS_POR_PAGINA));
    }
  }

  async function aoReservar(reserva) {
    setModalAberto(false);
    setReservaFeita(reserva);
    setSelecionados([]);
    await carregarNumeros().catch(() => {});
  }

  const total = selecionados.length * (config?.valor_numero ?? 0);
  const livresDisponiveis = contadores.livre;
  const totalPaginas = Math.max(1, Math.ceil(numeros.length / NUMEROS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const numerosDaPagina = numeros.slice(
    paginaAtual * NUMEROS_POR_PAGINA,
    (paginaAtual + 1) * NUMEROS_POR_PAGINA
  );

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-neutral-400">
        Carregando a rifa…
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card elev-md max-w-sm text-center">
          <p className="font-heading text-ink">Não foi possível carregar a rifa.</p>
          <p className="text-[13px] text-neutral-400">{erro}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen justify-center px-4 py-8">
      <div className="flex w-full max-w-[440px] flex-col gap-4">
        <header className="nav rounded-md">
          <span className="nav-brand flex items-center gap-2">
            <Ticket size={20} className="text-accent" aria-hidden="true" />
            Rifa
          </span>
          <span className="text-[12px] tabular-nums text-neutral-400">
            {contadores.livre} livres
          </span>
        </header>

        <ProgressoRifa config={config} contadores={contadores} />

        <section className="card gap-3">
          <span className="card-title text-[15px]">Escolha rápida</span>
          <div className="grid grid-cols-3 gap-2">
            {ATALHOS.map((qtd) => (
              <button
                key={qtd}
                type="button"
                className="btn btn-secondary"
                disabled={livresDisponiveis === 0}
                onClick={() => escolhaRapida(qtd)}
              >
                {qtd} números
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="card-title text-[15px]">Ou toque na grade</span>
            <button
              type="button"
              className="btn btn-ghost text-[12px]"
              disabled={selecionados.length === 0}
              onClick={() => setSelecionados([])}
            >
              Limpar seleção
            </button>
          </div>

          <Legenda contadores={contadores} />

          <Grade numeros={numerosDaPagina} selecionados={selecionados} onToggle={alternar} />

          <Paginacao
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            tamanho={NUMEROS_POR_PAGINA}
            totalNumeros={numeros.length}
            onIr={setPagina}
          />
        </section>

        <CardConfianca />

        <p className="text-center text-[11px] text-neutral-500">
          A grade atualiza sozinha a cada {INTERVALO_ATUALIZACAO / 1000} segundos.{' '}
          <Link to="/admin" className="text-accent-300 underline">
            Área do organizador
          </Link>
        </p>

        {/* Some enquanto um modal está aberto: o resumo já está dentro dele, e o
            fundo opaco da barra atravessaria o backdrop translúcido do sistema. */}
        <div
          className="card elev-lg sticky bottom-4 flex-row items-center gap-4 bg-neutral-800"
          hidden={modalAberto || Boolean(reservaFeita)}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate text-[11px] text-neutral-400">
              {selecionados.length === 0
                ? 'Nenhum número selecionado'
                : `${selecionados.length} ${selecionados.length === 1 ? 'número' : 'números'}: ${selecionados
                    .map((n) => String(n).padStart(2, '0'))
                    .join(', ')}`}
            </span>
            <span className="text-[20px] font-medium tabular-nums text-ink">
              {formatarMoeda(total)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary shrink-0"
            disabled={selecionados.length === 0}
            onClick={() => setModalAberto(true)}
          >
            Continuar
          </button>
        </div>
      </div>

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
