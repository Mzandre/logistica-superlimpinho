const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Criar tabela pedidos se não existir
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente TEXT NOT NULL,
        vendedor TEXT NOT NULL,
        status TEXT DEFAULT 'separando',
        datahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        observacao TEXT
      )
    `);
    console.log('Tabela pedidos criada/verificada com sucesso.');
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
  }
};

// Chamar inicialização
initDB();

module.exports = pool;