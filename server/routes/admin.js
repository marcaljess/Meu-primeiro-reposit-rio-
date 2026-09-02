const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomInt, randomBytes } = require('crypto');
const { db, getConfig, sincronizarNumeros, UPLOADS_DIR } = require('../db');
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
  const foto_url = String(b.foto_url ?? atual.foto_url).trim();
  const total_numeros = Number(b.total_numeros ?? atual.total_numeros);
  const valor_numero = Number(b.valor_numero ?? atual.valor_numero);

  if (!titulo) return res.status(400).json({ erro: 'O título não pode ficar vazio.' });
  if (!Number.isInteger(total_numeros) || total_numeros < 1 || total_numeros > 100000) {
    return res.status(400).json({ erro: 'Total de números deve ser um inteiro entre 1 e 100000.' });
  }
  if (!Number.isFinite(valor_numero) || valor_numero < 0) {
    return res.status(400).json({ erro: 'Valor por número inválido.' });
  }
  // Ou uma foto que nós guardamos, ou um endereço http(s) de fora.
  if (foto_url && !/^(\/uploads\/[\w.-]+|https?:\/\/\S+)$/.test(foto_url)) {
    return res.status(400).json({ erro: 'Endereço de foto inválido.' });
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
              valor_numero = ?, chave_pix = ?, data_sorteio = ?, foto_url = ?
       WHERE id = 1`
    ).run(titulo, descricao, total_numeros, valor_numero, chave_pix, data_sorteio, foto_url);
    sincronizarNumeros(total_numeros);
  })();

  res.json(getConfig());
});

// ---------------------------------------------------------------------------
// Foto do prêmio
// ---------------------------------------------------------------------------

const TIPOS_IMAGEM = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const LIMITE_FOTO = 5 * 1024 * 1024;

/**
 * Confere os bytes iniciais do arquivo. O Content-Type vem do cliente e não é
 * confiável — sem isso daria para gravar qualquer conteúdo com rótulo de imagem.
 */
function ehImagem(buffer, tipo) {
  if (!buffer || buffer.length < 12) return false;
  if (tipo === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (tipo === 'image/png') {
    return buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (tipo === 'image/webp') {
    return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

/** Apaga a foto anterior, se ela for um arquivo que nós mesmos guardamos. */
function apagarFotoAnterior(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const alvo = path.join(UPLOADS_DIR, path.basename(url));
  // path.basename já impede subir de diretório; a checagem abaixo é a garantia.
  if (!alvo.startsWith(UPLOADS_DIR)) return;
  fs.rm(alvo, { force: true }, () => {});
}

/** POST /api/admin/foto — corpo é o arquivo cru, com o Content-Type da imagem. */
router.post(
  '/foto',
  express.raw({ type: Object.keys(TIPOS_IMAGEM), limit: LIMITE_FOTO }),
  (req, res) => {
    const tipo = String(req.get('content-type') || '').split(';')[0].trim();
    const extensao = TIPOS_IMAGEM[tipo];

    if (!extensao) {
      return res.status(415).json({ erro: 'Envie uma imagem JPEG, PNG ou WebP.' });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ erro: 'Arquivo vazio.' });
    }
    if (!ehImagem(req.body, tipo)) {
      return res.status(400).json({ erro: 'O arquivo não parece ser uma imagem válida.' });
    }

    const nome = randomBytes(16).toString('hex') + extensao;
    fs.writeFileSync(path.join(UPLOADS_DIR, nome), req.body);

    const anterior = getConfig().foto_url;
    db.prepare('UPDATE config SET foto_url = ? WHERE id = 1').run('/uploads/' + nome);
    apagarFotoAnterior(anterior);

    res.status(201).json(getConfig());
  }
);

/** DELETE /api/admin/foto — remove a foto do prêmio. */
router.delete('/foto', (req, res) => {
  const anterior = getConfig().foto_url;
  db.prepare("UPDATE config SET foto_url = '' WHERE id = 1").run();
  apagarFotoAnterior(anterior);
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
