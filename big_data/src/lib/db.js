import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../pybig/news.db');
const db = new Database(dbPath, { verbose: console.log });

export default db;