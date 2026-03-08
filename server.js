const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rota para servir as páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/logistica', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logistica.html'));
});

app.get('/painel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

// API Routes

// Criar novo pedido
app.post('/api/pedidos', async (req, res) => {
  const { cliente, vendedor, observacao } = req.body;

  if (!cliente || !vendedor) {
    return res.status(400).json({ error: 'Cliente e vendedor são obrigatórios' });
  }

  try {
    const sql = 'INSERT INTO pedidos (cliente, vendedor, status, datahora, observacao) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING id';
    const result = await db.query(sql, [cliente, vendedor, 'separando', observacao || '']);
    res.json({ id: result.rows[0].id, message: 'Pedido criado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar todos os pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const sql = `SELECT id, cliente, vendedor, status,
                        to_char(datahora, 'YYYY-MM-DD HH24:MI:SS') as datahora,
                        observacao
                 FROM pedidos ORDER BY datahora DESC`;
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status do pedido
app.put('/api/pedidos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['separando', 'separado', 'faltando'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const sql = 'UPDATE pedidos SET status = $1 WHERE id = $2';
    const result = await db.query(sql, [status, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json({ message: 'Status atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar estatísticas
app.get('/api/estatisticas', async (req, res) => {
  try {
    const sql = `
      SELECT
        COUNT(CASE WHEN status = 'separando' THEN 1 END) as separando,
        COUNT(CASE WHEN status = 'separado' THEN 1 END) as separados,
        COUNT(CASE WHEN status = 'faltando' THEN 1 END) as faltando,
        COUNT(*) as total
      FROM pedidos
    `;
    const result = await db.query(sql);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar todos os pedidos
app.delete('/api/pedidos/clear-all', async (req, res) => {
  try {
    const sql = 'DELETE FROM pedidos';
    const result = await db.query(sql);
    res.json({ message: 'Todos os pedidos foram removidos com sucesso', deletedCount: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar pedido específico
app.delete('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM pedidos WHERE id = $1';
    const result = await db.query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json({ message: 'Pedido removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});