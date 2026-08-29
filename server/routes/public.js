const express = require('express');
const { db, getConfig } = require('../db');

const router = express.Router();

/** GET /api/config — dados públicos da rifa. */
router.get('/config', (req, res) => {
  res.json(getConfig());
});

/** GET /api/numeros — apenas número e status, sem qualquer dado pessoal. */
router.get('/numeros', (req, res) => {
  const numeros = db
    .prepare('SELECT numero, status FROM numeros ORDER BY numero')
    .all();
  const contadores = { livre: 0, reservado: 0, confirmado: 0 };
  for (const n of numeros) contadores[n.status]++;
  res.json({ numeros, contadores });
});

/**
 * POST /api/reservas — cria uma reserva.
 * Regras 1-3: dentro de uma transação, todos os números precisam estar `livre`;
 * se algum não estiver, nada é gravado e a resposta informa quais foram pegos.
 */
router.post('/reservas', (req, res) => {
  const nome = String(req.body?.nome ?? '').trim();
  const contato = String(req.body?.contato ?? '').trim();
  const brutos = req.body?.numeros;

  if (!nome) return res.status(400).json({ erro: 'Informe seu nome.' });
  if (!contato) return res.status(400).json({ erro: 'Informe um contato (WhatsApp/telefone).' });
  if (nome.length > 120 || contato.length > 120) {
    return res.status(400).json({ erro: 'Nome ou contato longo demais.' });
  }
  if (!Array.isArray(brutos) || brutos.length === 0) {
    return res.status(400).json({ erro: 'Selecione pelo menos um número.' });
  }

  const numeros = [...new Set(brutos.map(Number))];
  if (numeros.some((n) => !Number.isInteger(n) || n < 1)) {
    return res.status(400).json({ erro: 'Lista de números inválida.' });
  }

  const criar = db.transaction((dados) => {
    const buscar = db.prepare('SELECT numero, status FROM numeros WHERE numero = ?');
    const indisponiveis = [];
    const inexistentes = [];

    for (const n of dados.numeros) {
      const linha = buscar.get(n);
      if (!linha) inexistentes.push(n);
      else if (linha.status !== 'livre') indisponiveis.push(n);
    }
    if (inexistentes.length) {
      const erro = new Error('numeros_inexistentes');
      erro.detalhe = { erro: 'Alguns números não existem nesta rifa.', numeros: inexistentes };
      throw erro;
    }
    if (indisponiveis.length) {
      const erro = new Error('numeros_indisponiveis');
      erro.detalhe = {
        erro: 'Alguns números já foram escolhidos por outra pessoa. Selecione outros.',
        numeros: indisponiveis.sort((a, b) => a - b),
      };
      throw erro;
    }

    const criada_em = new Date().toISOString();
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO reservas (nome, contato, criada_em, status, paga_em)
         VALUES (?, ?, ?, 'pendente', NULL)`
      )
      .run(dados.nome, dados.contato, criada_em);

    const ocupar = db.prepare(
      `UPDATE numeros SET status = 'reservado', reserva_id = ?
       WHERE numero = ? AND status = 'livre'`
    );
    for (const n of dados.numeros) {
      const r = ocupar.run(lastInsertRowid, n);
      // Segurança extra: se a linha não mudou, alguém pegou o número no meio do caminho.
      if (r.changes !== 1) {
        const erro = new Error('numeros_indisponiveis');
        erro.detalhe = {
          erro: 'Alguns números já foram escolhidos por outra pessoa. Selecione outros.',
          numeros: [n],
        };
        throw erro;
      }
    }
    return { id: Number(lastInsertRowid), criada_em };
  });

  let resultado;
  try {
    // `immediate` pega o lock de escrita já na abertura da transação,
    // evitando duas reservas concorrentes lerem "livre" ao mesmo tempo.
    resultado = criar.immediate({ nome, contato, numeros });
  } catch (e) {
    if (e.detalhe) return res.status(409).json(e.detalhe);
    throw e;
  }

  const config = getConfig();
  res.status(201).json({
    id: resultado.id,
    nome,
    numeros: numeros.sort((a, b) => a - b),
    status: 'pendente',
    criada_em: resultado.criada_em,
    total: Number((numeros.length * config.valor_numero).toFixed(2)),
    chave_pix: config.chave_pix,
    valor_numero: config.valor_numero,
  });
});

module.exports = router;
