const sqlite3 = require('sqlite3').verbose();

// Criar banco de dados
const db = new sqlite3.Database('./logistica.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criar tabela pedidos se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT NOT NULL,
      vendedor TEXT NOT NULL,
      status TEXT DEFAULT 'separando',
      dataHora TEXT DEFAULT CURRENT_TIMESTAMP,
      observacao TEXT
    )
  `);
});

module.exports = db;