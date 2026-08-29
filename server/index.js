require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { init, DB_PATH } = require('./db');
const rotasPublicas = require('./routes/public');
const rotasAdmin = require('./routes/admin');

init();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', rotasPublicas);
app.use('/api/admin', rotasAdmin);

// Em produção o Express também serve o build do front (client/dist).
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Servidor da rifa em http://localhost:${PORT}`);
  console.log(`Banco de dados: ${DB_PATH}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ATENÇÃO: ADMIN_PASSWORD não definida — o painel do organizador ficará bloqueado.');
  }
});

module.exports = app;
