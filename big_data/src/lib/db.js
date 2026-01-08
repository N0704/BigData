import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../pybig/news.db');
const db = new Database(dbPath, { verbose: console.log });

// Đăng ký các hàm toán học cho SQLite
db.function('log', (val) => val <= 0 ? 0 : Math.log(val));
db.function('exp', (val) => Math.exp(val));

export default db;