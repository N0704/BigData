import sqlite3
import numpy as np
from config import DB_PATH

import math

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
# Register math functions for SQLite
conn.create_function("LOG", 1, math.log)
conn.create_function("EXP", 1, math.exp)

cursor = conn.cursor()
cursor.execute("PRAGMA journal_mode=WAL;")


def vec_to_blob(vec: np.ndarray) -> bytes:
    return vec.astype("float32").tobytes()

def blob_to_vec(blob: bytes) -> np.ndarray:
    return np.frombuffer(blob, dtype="float32")

def init_db():
    cursor.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clusters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        centroid BLOB NOT NULL,
        size INTEGER NOT NULL DEFAULT 1,
        hot_score REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE,
        title TEXT NOT NULL,
        content TEXT,
        summary TEXT,
        image_url TEXT,
        source TEXT,
        published_at DATETIME,
        category_id INTEGER,
        cluster_id INTEGER,
        embedding BLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (cluster_id) REFERENCES clusters(id)
            ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_clusters_hot
        ON clusters(category_id, hot_score DESC);

    -- Bài mới trong cluster
    CREATE INDEX IF NOT EXISTS idx_news_cluster_time
        ON news(cluster_id, published_at DESC);

    -- Bài theo category (trang chuyên mục)
    CREATE INDEX IF NOT EXISTS idx_news_category_time
        ON news(category_id, published_at DESC);

    -- Tìm bài theo URL
    CREATE INDEX IF NOT EXISTS idx_news_url
        ON news(url);
    """)
    conn.commit()
