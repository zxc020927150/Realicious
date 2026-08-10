import mysql from 'mysql2/promise';

// 直接使用 process.env，因為你的 dev 指令已經幫你讀取 .env 了
const pool = mysql.createPool({
  host:process.env.DB_HOST,
  user:process.env.DB_USER,
  password:process.env.DB_PASS,
  database:process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool;