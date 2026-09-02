async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(opcoes.headers ?? {}),
    },
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const erro = new Error(dados?.erro ?? `Falha na requisição (${resposta.status}).`);
    erro.status = resposta.status;
    erro.numeros = dados?.numeros ?? [];
    throw erro;
  }
  return dados;
}

const comSenha = (senha) => ({ 'x-admin-password': senha });

// ---------- Público ----------
export const getConfig = () => requisicao('/api/config');
export const getNumeros = () => requisicao('/api/numeros');
export const criarReserva = (payload) =>
  requisicao('/api/reservas', { method: 'POST', body: JSON.stringify(payload) });

// ---------- Organizador ----------
export const login = (senha) =>
  requisicao('/api/admin/login', { method: 'POST', headers: comSenha(senha) });

export const atualizarConfig = (senha, payload) =>
  requisicao('/api/admin/config', {
    method: 'PUT',
    headers: comSenha(senha),
    body: JSON.stringify(payload),
  });

export const getReservas = (senha) =>
  requisicao('/api/admin/reservas', { headers: comSenha(senha) });

export const confirmarReserva = (senha, id) =>
  requisicao(`/api/admin/reservas/${id}/confirmar`, { method: 'POST', headers: comSenha(senha) });

export const liberarReserva = (senha, id) =>
  requisicao(`/api/admin/reservas/${id}/liberar`, { method: 'POST', headers: comSenha(senha) });

export const sortear = (senha) =>
  requisicao('/api/admin/sortear', { method: 'POST', headers: comSenha(senha) });

export const getSorteios = (senha) =>
  requisicao('/api/admin/sorteios', { headers: comSenha(senha) });

/** Envia a foto do prêmio como corpo binário — sem multipart, sem dependência. */
export const enviarFoto = (senha, arquivo) =>
  requisicao('/api/admin/foto', {
    method: 'POST',
    headers: { ...comSenha(senha), 'Content-Type': arquivo.type },
    body: arquivo,
  });

export const removerFoto = (senha) =>
  requisicao('/api/admin/foto', { method: 'DELETE', headers: comSenha(senha) });

// ---------- Utilidades ----------
export const formatarMoeda = (valor) =>
  Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarData(iso) {
  if (!iso) return '—';
  const data = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
