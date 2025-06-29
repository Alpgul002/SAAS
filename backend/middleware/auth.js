const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT * FROM tenants WHERE id = $1 AND is_active = true', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.tenant = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const result = await pool.query('SELECT * FROM tenants WHERE api_key = $1 AND is_active = true', [apiKey]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.tenant = result.rows[0];
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
};

module.exports = { authenticateToken, authenticateApiKey }; 