'use server';

import db from '@/lib/db';

// =========================
// HELPERS
// =========================
const cleanForClient = (item) => {
  if (!item) return item;
  const { embedding, centroid, ...rest } = item;

  // Convert SQLite DATETIME (TEXT) sang ISO 8601 để JS Date parse chính xác
  if (rest.published_at) {
    rest.published_at = new Date(rest.published_at.replace(' ', 'T')).toISOString();
  }
  if (rest.created_at) {
    rest.created_at = new Date(rest.created_at.replace(' ', 'T')).toISOString();
  }
  if (rest.last_update) {
    rest.last_update = new Date(rest.last_update.replace(' ', 'T')).toISOString();
  }

  return rest;
};

const cleanArrayForClient = (array = []) => array.map(cleanForClient);

// =========================
// CATEGORIES
// =========================
export async function getCategories() {
  try {
    return db.prepare(`
      SELECT id, name, slug
      FROM categories
      ORDER BY name
    `).all();
  } catch (e) {
    console.error('getCategories error:', e);
    return [];
  }
}

// =========================
// HOT CLUSTERS (GLOBAL)
// =========================
export async function getHotClusters(limit = 10, offset = 0) {
  try {
    const sql = `
      SELECT
        c.id AS cluster_id,
        c.category_id,
        c.size,
        c.hot_score,
        c.created_at,
        c.last_update,
        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,
        cat.name AS category,
        cat.slug AS category_slug
      FROM clusters c
      LEFT JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
        ORDER BY published_at DESC
        LIMIT 1
      )
      ORDER BY c.hot_score DESC
      LIMIT ? OFFSET ?;
    `;

    const stmt = db.prepare(sql);
    const clusters = stmt.all(limit, offset);

    return cleanArrayForClient(clusters);
  } catch (error) {
    console.error('Error fetching hot clusters:', error);
    return [];
  }
}

// =========================
// HOT TODAY
// =========================
export async function getFeaturedClustersToday(limit = 7) {
  try {
    const sql = `
      SELECT
        c.id AS cluster_id,
        c.size,
        c.hot_score,
        strftime('%Y-%m-%dT%H:%M:%S', c.last_update) AS last_update,

        cat.name AS category,
        cat.slug AS category_slug,

        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,

        (
          MIN(c.size, 15) * 1.5 +
          (strftime('%s','now') - strftime('%s', n.published_at)) * -0.00002 +
          (strftime('%s','now') - strftime('%s', c.last_update)) * -0.00003
        ) AS featured_score

      FROM clusters c
      JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
        ORDER BY published_at DESC
        LIMIT 1
      )
      WHERE n.published_at >= date('now', 'localtime')
      ORDER BY featured_score DESC
      LIMIT ?;
    `;

    return cleanArrayForClient(db.prepare(sql).all(limit));
  } catch (e) {
    console.error('getFeaturedClustersToday error:', e);
    return [];
  }
}

// =========================
// HOT TRENDING (48h)
// =========================
export async function getHotClustersTrending(limit = 10) {
  try {
    const sql = `
      SELECT
        c.id AS cluster_id,
        c.hot_score,
        c.size,
        strftime('%Y-%m-%dT%H:%M:%S', c.last_update) AS last_update,

        cat.name AS category,
        cat.slug AS category_slug,

        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,

        (
          c.hot_score * 0.6 +
          (strftime('%s','now') - strftime('%s', n.published_at)) * -0.00001 +
          (strftime('%s','now') - strftime('%s', c.last_update)) * -0.00002
        ) AS trending_score

      FROM clusters c
      JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
        ORDER BY published_at DESC
        LIMIT 1
      )
      WHERE n.published_at >= datetime('now', '-48 hours')
      ORDER BY trending_score DESC
      LIMIT ?;
    `;

    return cleanArrayForClient(db.prepare(sql).all(limit));
  } catch (e) {
    console.error('getHotClustersTrending error:', e);
    return [];
  }
}

// =========================
// LATEST NEWS FEED
// =========================
export async function getLatestNews(page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        n.id AS news_id,
        n.title,
        n.url,
        n.summary,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,
        strftime('%Y-%m-%dT%H:%M:%S', n.created_at) AS created_at,
        n.cluster_id,

        cat.name AS category,
        cat.slug AS category_slug,

        c.size,
        c.hot_score

      FROM news n
      LEFT JOIN clusters c ON c.id = n.cluster_id
      LEFT JOIN categories cat ON cat.id = n.category_id

      ORDER BY
        n.published_at DESC
      LIMIT ? OFFSET ?;
    `;

    return cleanArrayForClient(db.prepare(sql).all(limit, offset));
  } catch (e) {
    console.error('getLatestNews error:', e);
    return [];
  }
}

// =========================
// GET NEWS BY CLUSTER ID
// =========================
export async function getNewsByClusterId(clusterId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,

        cat.name AS category,
        cat.slug AS category_slug,

        c.hot_score

      FROM news n
      LEFT JOIN clusters c ON c.id = n.cluster_id
      LEFT JOIN categories cat ON cat.id = n.category_id
      WHERE n.cluster_id = ?
      ORDER BY n.published_at DESC
      LIMIT ? OFFSET ?;
    `;

    return cleanArrayForClient(db.prepare(sql).all(clusterId, limit, offset));
  } catch (e) {
    console.error('getNewsByClusterId error:', e);
    return [];
  }
}

// =========================
// GET NEWS BY CATEGORY SLUG
// =========================
export async function getNewsByCategorySlug(slug, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,

        cat.name AS category,
        cat.slug AS category_slug,

        c.size,
        c.hot_score,
        n.cluster_id

      FROM news n
      JOIN categories cat ON cat.id = n.category_id
      LEFT JOIN clusters c ON c.id = n.cluster_id
      WHERE cat.slug = ?
      ORDER BY n.published_at DESC
      LIMIT ? OFFSET ?;
    `;

    return cleanArrayForClient(db.prepare(sql).all(slug, limit, offset));
  } catch (e) {
    console.error('getNewsByCategorySlug error:', e);
    return [];
  }
}

// =========================
// SEARCH
// =========================
export async function searchNews(query, categoryId = null, limit = 20) {
  try {
    const safeQuery = query.replace(/[%_]/g, '\\$&');

    let sql = `
      SELECT
        n.id AS news_id,
        n.title,
        n.url,
        n.summary,
        n.image_url,
        n.source,
        n.published_at,
        n.cluster_id,
        cat.name AS category,
        c.size,
        c.hot_score

      FROM news n
      JOIN categories cat ON cat.id = n.category_id
      LEFT JOIN clusters c ON c.id = n.cluster_id
      WHERE (n.title LIKE ? ESCAPE '\\'
         OR n.summary LIKE ? ESCAPE '\\')
    `;

    const params = [`%${safeQuery}%`, `%${safeQuery}%`];

    if (categoryId) {
      sql += ` AND n.category_id = ?`;
      params.push(categoryId);
    }

    sql += `
      ORDER BY
        COALESCE(c.hot_score, 0) DESC,
        n.published_at DESC
      LIMIT ?
    `;

    params.push(limit);

    return cleanArrayForClient(
      db.prepare(sql).all(...params)
    );
  } catch (e) {
    console.error('searchNews error:', e);
    return [];
  }
}

// =========================
// GET NEWS CONTENT
// =========================
export async function getNewsContent(id) {
  try {
    const sql = `
      SELECT content
      FROM news
      WHERE id = ?
    `;
    const result = db.prepare(sql).get(id);
    return result ? cleanForClient(result) : null;
  } catch (e) {
    console.error('getNewsContent error:', e);
    return null;
  }
}
