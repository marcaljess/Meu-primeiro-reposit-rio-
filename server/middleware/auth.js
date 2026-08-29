const crypto = require('crypto');

function senhaConfigurada() {
  return process.env.ADMIN_PASSWORD || '';
}

/** Comparação em tempo constante, tolerante a tamanhos diferentes. */
function senhaValida(recebida) {
  const esperada = senhaConfigurada();
  if (!esperada) return false;
  const a = crypto.createHash('sha256').update(String(recebida ?? '')).digest();
  const b = crypto.createHash('sha256').update(esperada).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Bloqueia (401) qualquer requisição sem o header `x-admin-password` válido. */
function requireAdmin(req, res, next) {
  if (!senhaConfigurada()) {
    return res.status(500).json({
      erro: 'ADMIN_PASSWORD não está definida no servidor. Configure o .env.',
    });
  }
  if (!senhaValida(req.get('x-admin-password'))) {
    return res.status(401).json({ erro: 'Senha inválida.' });
  }
  next();
}

module.exports = { requireAdmin, senhaValida };
