const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        String(process.env.DATABASE_SSL).toLowerCase() === 'true'
            ? { rejectUnauthorized: false }
            : false
});

pool.on('error', e =>
    console.error('PostgreSQL pool error:', e)
);

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params)
};