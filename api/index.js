import pg from 'pg';
const { Pool } = pg;

// Neon PostgreSQL veritabanı bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon ve Vercel için gereklidir
  }
});

export default async function handler(req, res) {
  // CORS Ayarları (Ön yüzün API'ye sorunsuz erişebilmesi için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tarayıcıların güvenlik amaçlı attığı ön isteği (OPTIONS) onayla
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, body, query } = req;

    // === VERİ GETİRME (SAYFA YENİLENİNCE CARİLERİN SİLİNMEMESİ İÇİN) ===
    if (method === 'GET') {
      // NOT: 'cariler' tablo ismini Neon'daki kendi tablo ismine göre düzenleyebilirsin
      const result = await pool.query('SELECT * FROM cariler ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    // === YENİ VERİ KAYDETME (CARİ OLUŞTURMA) ===
    if (method === 'POST') {
      const data = body;
      
      // index.html'den gelen verilere göre SQL sütunlarını ayarlıyoruz
      // Eğer ön yüzde ad, telefon gibi veriler varsa values dizisini ona göre doldururuz
      const sql = `
        INSERT INTO cariler (isim, bakiye, tarih) 
        VALUES ($1, $2, $3) 
        RETURNING *;
      `;
      const values = [data.isim, data.bakiye || 0, data.tarih || new Date()];
      
      const result = await pool.query(sql, values);
      return res.status(200).json({ success: true, data: result.rows[0] });
    }

    // İstenmeyen bir metod gelirse uyar
    return res.status(405).json({ error: 'Sadece GET ve POST istekleri kabul edilir.' });

  } catch (error) {
    console.error('Veritabanı Hatası:', error);
    return res.status(500).json({ 
      error: 'Veritabanı işlemi başarısız oldu.', 
      detay: error.message 
    });
  }
}
