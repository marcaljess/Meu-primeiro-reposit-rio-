# 🎟️ Sistema de Rifa (Ação Entre Amigos)

Aplicação web completa para organizar uma rifa: os participantes reservam os
números sozinhos por um link público, o organizador valida os pagamentos em um
painel protegido por senha, e o sorteio escolhe o ganhador **apenas entre os
números já pagos**.

Interface toda em **português (Brasil)** e **mobile-first**.

---

## Stack

| Camada   | Tecnologia                                  |
| -------- | ------------------------------------------- |
| Backend  | Node.js + Express                           |
| Banco    | SQLite via `better-sqlite3` (arquivo local) |
| Frontend | React + Vite + Tailwind CSS                 |
| Monorepo | npm workspaces + `concurrently`             |

---

## Como rodar localmente

Requisitos: **Node.js 18+**.

```bash
# 1. Instalar as dependências (raiz, servidor e cliente de uma vez)
npm install

# 2. Criar o arquivo de ambiente e definir a senha do organizador
cp .env.example .env
#   edite .env e troque ADMIN_PASSWORD

# 3. Subir backend + frontend juntos
npm run dev
```

- Página pública: <http://localhost:5173>
- Painel do organizador: <http://localhost:5173/admin>
- API: <http://localhost:3001>

O Vite faz proxy de `/api` para o Express, então não é preciso configurar CORS
durante o desenvolvimento.

Na primeira execução o banco (`server/rifa.db`) é criado automaticamente, com uma
configuração de exemplo (100 números a R$ 10,00) e todos os números `livre`.
Tudo isso é editável depois no painel.

### Variáveis de ambiente

| Variável         | Padrão          | Descrição                                    |
| ---------------- | --------------- | -------------------------------------------- |
| `ADMIN_PASSWORD` | — (obrigatória) | Senha única do painel do organizador          |
| `PORT`           | `3001`          | Porta do Express                              |
| `DB_PATH`        | `server/rifa.db`| Caminho do arquivo SQLite                     |

Sem `ADMIN_PASSWORD` o servidor sobe, mas todas as rotas do painel respondem 401.

### Rodar em modo produção

```bash
npm install
npm run build    # gera client/dist
npm start        # Express serve a API e o front no mesmo endereço (PORT)
```

---

## Como usar

### Participante (página pública)

1. Toca nos números **livres** (só contorno) que quiser — ou usa a escolha rápida de 5, 10 ou 20 números.
2. Informa nome e WhatsApp e confirma.
3. A tela mostra a **chave PIX** e o **valor total** (nº de números × valor).
   Basta pagar e mandar o comprovante ao organizador.
4. Os números escolhidos passam a aparecer como **aguardando pagamento** para todo mundo.

A grade se atualiza sozinha a cada 5 segundos, então dá para acompanhar a rifa
enchendo em tempo quase real. **Nenhum dado pessoal aparece na página pública** —
só o status de cada número.

### Organizador (`/admin`)

1. Entra com a senha do `.env`.
2. **Configuração da rifa** — edita título, descrição, total de números, valor,
   chave PIX e data do sorteio.
3. **Reservas** — vê nome, contato, números, status e data de cada reserva, com
   filtros por situação.
   - **Validar pagamento**: os números viram `confirmado` e a reserva sai da
     lista de pendentes.
   - **Liberar números**: cancela a reserva e devolve os números para `livre`.
4. **Resumo** — livres, reservados, confirmados e total arrecadado.
5. **Sorteio** — sorteia entre os números confirmados e destaca número + nome.

> A senha fica apenas na memória da aba (nunca em `localStorage`), então
> recarregar a página pede login de novo.

---

## Design

A interface segue o sistema **Nocturne**, exportado do Claude Design e versionado
em `client/src/styles/nocturne.css` — essa folha é a fonte da verdade do visual.

- Fundo escuro `#161826`, texto `#e9e9ed` e um único acento blurple `#9184d9`,
  usado como **contorno e brilho, nunca como preenchimento de área**.
- Tipografia Inter (via Google Fonts), raios de 8px e escala de espaçamento
  compacta (densidade 0.7×).
- Ícones [Phosphor](https://phosphoricons.com) (`@phosphor-icons/react`).
- Componentes prontos na folha: `.btn`, `.card`, `.input`, `.tag`, `.nav`,
  `.dialog`. O guia completo está em `client/src/styles/nocturne-readme.md`.

O `tailwind.config.js` espelha os tokens, então classes como `bg-surface`,
`text-accent-300` ou `rounded-md` resolvem para as variáveis do sistema — **nenhuma
cor fica escrita à mão nos componentes**. Para mudar o visual, edite os tokens no
topo de `nocturne.css`: tudo acompanha.

A tela pública segue a direção "prova primeiro": herói do prêmio, progresso de
vendas, escolha rápida (5/10/20 números), grade e um card explicando o
tratamento dos dados, com a barra de resumo fixa no rodapé.

Os três estados do número não usam cor semântica saturada: livre é só contorno,
aguardando pagamento é um cinza cheio e pago é o acento tingido.

---

## Regras de negócio

1. Só é possível reservar um número que esteja `livre`.
2. Ao reservar vários números, a validação acontece **dentro de uma transação
   SQLite `IMMEDIATE`**: se qualquer um deles já tiver sido pego, nada é gravado
   e a resposta (HTTP 409) informa exatamente quais números falharam. Isso
   impede vender o mesmo número duas vezes em acessos simultâneos.
3. Criar reserva → números viram `reservado`, reserva fica `pendente`.
4. Validar pagamento → números viram `confirmado`, reserva fica `paga`
   (com `paga_em` registrado).
5. Liberar → números voltam a `livre`, reserva fica `cancelada`.
6. O sorteio escolhe aleatoriamente (`crypto.randomInt`) apenas entre números
   `confirmado`.
7. Nome e contato dos compradores só aparecem no painel do organizador.

---

## API

### Rotas públicas

| Método | Rota            | Descrição                                          |
| ------ | --------------- | -------------------------------------------------- |
| `GET`  | `/api/config`   | Dados da rifa                                       |
| `GET`  | `/api/numeros`  | Números com status + contadores (sem dados pessoais)|
| `POST` | `/api/reservas` | Cria reserva: `{ nome, contato, numeros: number[] }`|

`POST /api/reservas` responde `201` com `{ id, numeros, total, chave_pix, ... }`,
ou `409` com `{ erro, numeros }` quando algum número já foi pego.

### Rotas protegidas

Exigem o header `x-admin-password`. Sem ele (ou com senha errada) → `401`.

| Método | Rota                                  | Descrição                     |
| ------ | ------------------------------------- | ----------------------------- |
| `POST` | `/api/admin/login`                    | Valida a senha                 |
| `PUT`  | `/api/admin/config`                   | Atualiza a configuração        |
| `GET`  | `/api/admin/reservas`                 | Reservas completas + resumo    |
| `POST` | `/api/admin/reservas/:id/confirmar`   | Valida o pagamento (regra 4)   |
| `POST` | `/api/admin/reservas/:id/liberar`     | Libera os números (regra 5)    |
| `POST` | `/api/admin/sortear`                  | Sorteia (regra 6)              |
| `GET`  | `/api/admin/sorteios`                 | Histórico de sorteios          |

---

## Modelo de dados

**`config`** (linha única): `titulo`, `descricao`, `total_numeros`,
`valor_numero`, `chave_pix`, `data_sorteio`.

**`reservas`**: `id`, `nome`, `contato`, `criada_em`, `status`
(`pendente` | `paga` | `cancelada`), `paga_em`.

**`numeros`**: `numero` (PK, 1..`total_numeros`), `status`
(`livre` | `reservado` | `confirmado`), `reserva_id`.

**`sorteios`**: `id`, `numero`, `nome`, `sorteado_em` — guarda o resultado para
que ele sobreviva a um refresh da página.

Aumentar `total_numeros` no painel cria os novos números como `livre`. Reduzir só
é permitido se todos os números acima do novo limite estiverem livres.

---

## Estrutura de pastas

```
/
├── server/
│   ├── index.js            # Express + estáticos do build
│   ├── db.js               # SQLite, migrations e seed
│   ├── routes/
│   │   ├── public.js       # config, numeros, reservas
│   │   └── admin.js        # login, config, reservas, sorteio
│   └── middleware/auth.js  # checagem do x-admin-password
├── client/
│   └── src/
│       ├── pages/          # Home (grade), Admin (painel)
│       ├── components/     # Grade, Legenda, ModalReserva,
│       │                   # ReservaConfirmada, ListaReservas,
│       │                   # FormConfig, Sorteio
│       └── api.js          # chamadas fetch + formatação pt-BR
├── package.json            # workspaces + scripts dev/build/start
└── README.md
```

---

## Deploy

O ponto de atenção é sempre o mesmo: **o arquivo SQLite precisa de armazenamento
persistente**. Em plataformas com disco efêmero, o banco é apagado a cada deploy
ou reinício.

### Render

1. **New → Web Service**, apontando para este repositório.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Em **Environment**, defina `ADMIN_PASSWORD` e `DB_PATH=/var/data/rifa.db`.
5. Em **Disks**, adicione um disco persistente (1 GB basta) montado em
   `/var/data`. Sem isso a rifa é zerada a cada deploy.

O Render define `PORT` automaticamente; o servidor já respeita essa variável.

### Railway

1. **New Project → Deploy from GitHub repo**.
2. Build: `npm install && npm run build` · Start: `npm start`.
3. Em **Variables**, defina `ADMIN_PASSWORD` e `DB_PATH=/data/rifa.db`.
4. Adicione um **Volume** montado em `/data`.

### Backup

O banco inteiro é um arquivo só. Para guardar uma cópia:

```bash
cp /var/data/rifa.db ./backup-rifa-$(date +%F).db
```

---

## Verificação

O fluxo foi testado ponta a ponta, incluindo a regra 2: oito requisições
simultâneas disputando os mesmos números resultam em **exatamente uma** reserva
criada; as outras sete recebem `409` com a lista dos números indisponíveis.
