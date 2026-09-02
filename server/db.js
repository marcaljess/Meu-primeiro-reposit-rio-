const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'rifa.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Valores de exemplo usados no primeiro boot. Editáveis depois pelo painel.
const CONFIG_PADRAO = {
  titulo: 'Rifa entre Amigos',
  descricao: 'Concorra ao prêmio! Escolha seu número, faça o PIX e envie o comprovante.',
  total_numeros: 100,
  valor_numero: 10,
  chave_pix: 'seu-email@exemplo.com',
  data_sorteio: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  foto_url: '',
};

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id             INTEGER PRIMARY KEY CHECK (id = 1),
      titulo         TEXT    NOT NULL,
      descricao      TEXT    NOT NULL DEFAULT '',
      total_numeros  INTEGER NOT NULL,
      valor_numero   REAL    NOT NULL,
      chave_pix      TEXT    NOT NULL DEFAULT '',
      data_sorteio   TEXT    NOT NULL DEFAULT '',
      foto_url       TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL,
      contato   TEXT NOT NULL,
      criada_em TEXT NOT NULL,
      status    TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'paga', 'cancelada')),
      paga_em   TEXT
    );

    CREATE TABLE IF NOT EXISTS numeros (
      numero     INTEGER PRIMARY KEY,
      status     TEXT NOT NULL DEFAULT 'livre'
                 CHECK (status IN ('livre', 'reservado', 'confirmado')),
      reserva_id INTEGER REFERENCES reservas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sorteios (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      numero       INTEGER NOT NULL,
      nome         TEXT NOT NULL,
      sorteado_em  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_numeros_reserva ON numeros(reserva_id);
    CREATE INDEX IF NOT EXISTS idx_numeros_status  ON numeros(status);
  `);
}

/** Adiciona colunas novas a bancos criados por versões anteriores. */
function migrarColunas() {
  const colunas = db.prepare('PRAGMA table_info(config)').all().map((c) => c.name);
  if (!colunas.includes('foto_url')) {
    db.exec("ALTER TABLE config ADD COLUMN foto_url TEXT NOT NULL DEFAULT ''");
  }
}

function seed() {
  const existe = db.prepare('SELECT 1 FROM config WHERE id = 1').get();
  if (!existe) {
    db.prepare(
      `INSERT INTO config (id, titulo, descricao, total_numeros, valor_numero, chave_pix, data_sorteio, foto_url)
       VALUES (1, @titulo, @descricao, @total_numeros, @valor_numero, @chave_pix, @data_sorteio, @foto_url)`
    ).run(CONFIG_PADRAO);
  }
  const { total_numeros } = getConfig();
  sincronizarNumeros(total_numeros);
}

/**
 * Garante que a tabela `numeros` contenha exatamente 1..total, todos `livre`
 * quando criados. Números excedentes só são removidos se estiverem livres.
 * Retorna quantos números excedentes não puderam ser removidos.
 */
function sincronizarNumeros(total) {
  const inserir = db.prepare(
    `INSERT OR IGNORE INTO numeros (numero, status, reserva_id) VALUES (?, 'livre', NULL)`
  );
  const aplicar = db.transaction((limite) => {
    for (let n = 1; n <= limite; n++) inserir.run(n);
    db.prepare(
      `DELETE FROM numeros WHERE numero > ? AND status = 'livre'`
    ).run(limite);
    return db
      .prepare(`SELECT COUNT(*) AS qtd FROM numeros WHERE numero > ?`)
      .get(limite).qtd;
  });
  return aplicar(total);
}

function getConfig() {
  return db.prepare('SELECT * FROM config WHERE id = 1').get();
}

function init() {
  migrate();
  migrarColunas();
  seed();
  return db;
}

const UPLOADS_DIR = path.join(path.dirname(DB_PATH), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

module.exports = {
  db,
  init,
  getConfig,
  sincronizarNumeros,
  CONFIG_PADRAO,
  DB_PATH,
  UPLOADS_DIR,
};
