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
app.post('/api/pedidos', (req, res) => {
  const { cliente, vendedor, observacao } = req.body;

  if (!cliente || !vendedor) {
    return res.status(400).json({ error: 'Cliente e vendedor são obrigatórios' });
  }

  const sql = 'INSERT INTO pedidos (cliente, vendedor, status, dataHora, observacao) VALUES (?, ?, ?, datetime("now"), ?)';
  const params = [cliente, vendedor, 'separando', observacao || ''];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: 'Pedido criado com sucesso' });
  });
});

// Buscar todos os pedidos
app.get('/api/pedidos', (req, res) => {
  const sql = 'SELECT * FROM pedidos ORDER BY dataHora DESC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Atualizar status do pedido
app.put('/api/pedidos/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['separando', 'separado', 'faltando'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const sql = 'UPDATE pedidos SET status = ? WHERE id = ?';

  db.run(sql, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json({ message: 'Status atualizado com sucesso' });
  });
});

// Buscar estatísticas
app.get('/api/estatisticas', (req, res) => {
  const sql = `
    SELECT
      COUNT(CASE WHEN status = 'separando' THEN 1 END) as separando,
      COUNT(CASE WHEN status = 'separado' THEN 1 END) as separados,
      COUNT(CASE WHEN status = 'faltando' THEN 1 END) as faltando,
      COUNT(*) as total
    FROM pedidos
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Deletar pedido específico
app.delete('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM pedidos WHERE id = ?';

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json({ message: 'Pedido removido com sucesso' });
  });
});

// Limpar todos os pedidos
app.delete('/api/pedidos/clear-all', (req, res) => {
  const sql = 'DELETE FROM pedidos';

  db.run(sql, [], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Todos os pedidos foram removidos com sucesso', deletedCount: this.changes });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});