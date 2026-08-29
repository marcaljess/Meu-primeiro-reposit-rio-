const express = require('express');
const { randomInt } = require('crypto');
const { db, getConfig, sincronizarNumeros } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/** POST /api/admin/login — valida a senha (o próprio middleware faz a checagem). */
router.post('/login', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// Todas as rotas abaixo exigem senha válida.
router.use(requireAdmin);

/** PUT /api/admin/config — atualiza a configuração da rifa. */
router.put('/config', (req, res) => {
  const atual = getConfig();
  const b = req.body ?? {};

  const titulo = String(b.titulo ?? atual.titulo).trim();
  const descricao = String(b.descricao ?? atual.descricao);
  const chave_pix = String(b.chave_pix ?? atual.chave_pix).trim();
  const data_sorteio = String(b.data_sorteio ?? atual.data_sorteio).trim();
  const total_numeros = Number(b.total_numeros ?? atual.total_numeros);
  const valor_numero = Number(b.valor_numero ?? atual.valor_numero);

  if (!titulo) return res.status(400).json({ erro: 'O título não pode ficar vazio.' });
  if (!Number.isInteger(total_numeros) || total_numeros < 1 || total_numeros > 100000) {
    return res.status(400).json({ erro: 'Total de números deve ser um inteiro entre 1 e 100000.' });
  }
  if (!Number.isFinite(valor_numero) || valor_numero < 0) {
    return res.status(400).json({ erro: 'Valor por número inválido.' });
  }

  // Ao reduzir o total, números já reservados/confirmados não são apagados.
  const ocupadosAcima = db
    .prepare(`SELECT numero FROM numeros WHERE numero > ? AND status <> 'livre' ORDER BY numero`)
    .all(total_numeros)
    .map((r) => r.numero);
  if (ocupadosAcima.length) {
    return res.status(409).json({
      erro:
        'Não é possível reduzir o total: há números acima do novo limite já reservados ou confirmados.',
      numeros: ocupadosAcima,
    });
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE config SET titulo = ?, descricao = ?, total_numeros = ?,
              valor_numero = ?, chave_pix = ?, data_sorteio = ?
       WHERE id = 1`
    ).run(titulo, descricao, total_numeros, valor_numero, chave_pix, data_sorteio);
    sincronizarNumeros(total_numeros);
  })();

  res.json(getConfig());
});

/** GET /api/admin/reservas — lista completa, com dados pessoais e resumo. */
router.get('/reservas', (req, res) => {
  const reservas = db
    .prepare(
      `SELECT id, nome, contato, criada_em, status, paga_em
         FROM reservas
        ORDER BY criada_em DESC, id DESC`
    )
    .all();

  const porReserva = new Map();
  for (const n of db
    .prepare('SELECT numero, reserva_id FROM numeros WHERE reserva_id IS NOT NULL ORDER BY numero')
    .all()) {
    if (!porReserva.has(n.reserva_id)) porReserva.set(n.reserva_id, []);
    porReserva.get(n.reserva_id).push(n.numero);
  }
  for (const r of reservas) r.numeros = porReserva.get(r.id) ?? [];

  res.json({ reservas, resumo: montarResumo() });
});

/** POST /api/admin/reservas/:id/confirmar — regra 4: pagamento validado. */
router.post('/reservas/:id/confirmar', (req, res) => {
  const id = Number(req.params.id);
  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
  if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });
  if (reserva.status === 'paga') return res.status(409).json({ erro: 'Esta reserva já está paga.' });
  if (reserva.status === 'cancelada') {
    return res.status(409).json({ erro: 'Esta reserva foi cancelada. Crie uma nova reserva.' });
  }

  const paga_em = new Date().toISOString();
  db.transaction(() => {
    db.prepare(`UPDATE numeros SET status = 'confirmado' WHERE reserva_id = ?`).run(id);
    db.prepare(`UPDATE reservas SET status = 'paga', paga_em = ? WHERE id = ?`).run(paga_em, id);
  })();

  res.json({ ...db.prepare('SELECT * FROM reservas WHERE id = ?').get(id), resumo: montarResumo() });
});

/** POST /api/admin/reservas/:id/liberar — regra 5: números voltam a `livre`. */
router.post('/reservas/:id/liberar', (req, res) => {
  const id = Number(req.params.id);
  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
  if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });
  if (reserva.status === 'cancelada') {
    return res.status(409).json({ erro: 'Esta reserva já está cancelada.' });
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE numeros SET status = 'livre', reserva_id = NULL WHERE reserva_id = ?`
    ).run(id);
    db.prepare(`UPDATE reservas SET status = 'cancelada', paga_em = NULL WHERE id = ?`).run(id);
  })();

  res.json({ ...db.prepare('SELECT * FROM reservas WHERE id = ?').get(id), resumo: montarResumo() });
});

/** POST /api/admin/sortear — regra 6: sorteia apenas entre números `confirmado`. */
router.post('/sortear', (req, res) => {
  const candidatos = db
    .prepare(
      `SELECT n.numero, r.nome
         FROM numeros n
         JOIN reservas r ON r.id = n.reserva_id
        WHERE n.status = 'confirmado'
        ORDER BY n.numero`
    )
    .all();

  if (candidatos.length === 0) {
    return res
      .status(409)
      .json({ erro: 'Não há números confirmados. Valide ao menos um pagamento antes de sortear.' });
  }

  const ganhador = candidatos[randomInt(candidatos.length)];
  const sorteado_em = new Date().toISOString();
  db.prepare('INSERT INTO sorteios (numero, nome, sorteado_em) VALUES (?, ?, ?)').run(
    ganhador.numero,
    ganhador.nome,
    sorteado_em
  );

  res.json({ numero: ganhador.numero, nome: ganhador.nome, sorteado_em, participantes: candidatos.length });
});

/** GET /api/admin/sorteios — histórico de sorteios (mais recente primeiro). */
router.get('/sorteios', (req, res) => {
  res.json(db.prepare('SELECT * FROM sorteios ORDER BY id DESC LIMIT 20').all());
});

function montarResumo() {
  const { valor_numero, total_numeros } = getConfig();
  const contagem = { livre: 0, reservado: 0, confirmado: 0 };
  for (const linha of db.prepare('SELECT status, COUNT(*) AS qtd FROM numeros GROUP BY status').all()) {
    contagem[linha.status] = linha.qtd;
  }
  return {
    ...contagem,
    total_numeros,
    valor_numero,
    total_arrecadado: Number((contagem.confirmado * valor_numero).toFixed(2)),
    total_potencial: Number((total_numeros * valor_numero).toFixed(2)),
  };
}

module.exports = router;
