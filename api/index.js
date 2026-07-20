const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // CORS izinleri
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Veritabanı tablosu yoksa otomatik oluşturan güvenli başlangıç
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (req.method === 'POST') {
      const { data } = req.body;
      await pool.query('INSERT INTO transactions (data) VALUES ($1)', [data]);
      return res.status(200).json({ success: true, message: 'Veri kaydedildi' });
    }

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY id DESC');
      return res.status(200).json({ success: true, data: rows });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
