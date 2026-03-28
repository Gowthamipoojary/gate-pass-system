const sql = require('mssql/msnodesqlv8')

const config = {
    user: 'YOUR_DB_USER',
    password: 'YOUR_DB_PASSWORD',
    server: 'localhost',
    database: 'GatePassDatabase',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    requestTimeout: 900000
};

// ✅ Create pool
const pool = new sql.ConnectionPool(config);
// ✅ Connect to the pool
const poolConnect = pool.connect()
    .then(() => console.log("✅ SQL Pool connected successfully"))
    .catch(err => console.error("❌ SQL Pool Error:", err));
module.exports = { sql, pool, poolConnect };
