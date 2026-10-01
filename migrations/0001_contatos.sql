-- Contact form submissions from /contato (written by worker/index.ts).
CREATE TABLE IF NOT EXISTS contatos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  cidade TEXT NOT NULL,
  servico TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  -- Site that received it (preview or production hostname).
  origem TEXT,
  user_agent TEXT,
  -- E-mail forwarding to the sales inbox: "pendente" until the EMAIL binding is configured,
  -- then "enviado" or "falhou". Lets old rows be re-sent once e-mail is enabled.
  email_status TEXT NOT NULL DEFAULT 'pendente'
);

CREATE INDEX IF NOT EXISTS idx_contatos_created_at ON contatos (created_at);
