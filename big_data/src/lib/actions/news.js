'use server';

import db from '@/lib/db';

// =========================
// HELPERS
// =========================
const REPORT_FILTER = `(report_count < 10 OR (report_count * 1.0 / MAX(view_count, 1) < 0.01))`;

export async function updateClusterHotScore(clusterId) {
  try {
    const HOT_DECAY_HOURS = 12.0;

    const sql = `
      UPDATE clusters
    SET hot_score = (
      MAX(0,
        (
          -- 1. Base score by cluster size
          CASE
            WHEN size = 1 THEN 0.3
            WHEN size = 2 THEN 1.0
            ELSE LOG(size + 1) * 2.5
          END

          -- 2. View boost (total + recent)
          + COALESCE((
              SELECT
                (LOG(1 + SUM(COALESCE(view_count, 0))) * 0.4)
                + (LOG(1 + COUNT(rl.id)) * 0.6)
              FROM news n
              LEFT JOIN read_logs rl
                ON rl.url = n.url
              AND rl.read_at >= datetime('now', '-24 hours')
              WHERE n.cluster_id = clusters.id
            ), 0)

          -- 3. Soft report penalty (view-aware)
          - COALESCE((
              SELECT
                MIN(
                  1.5,
                  LOG(1 + SUM(report_count)) *
                  (1 - EXP(-SUM(COALESCE(view_count, 0)) * 1.0 / 50))
                )
              FROM news
              WHERE cluster_id = clusters.id
            ), 0)
        )
      )

      -- 4. Time decay
      * EXP(
          -(
            (julianday('now') - julianday(COALESCE(last_update, created_at)))
            * 24.0
            / ${HOT_DECAY_HOURS}
          )
        )

      -- 5. Recent activity boost (clamped)
      * (
          1.0 + MIN(
            COALESCE((
              SELECT COUNT(*) * 0.1
              FROM news n
              WHERE n.cluster_id = clusters.id
                AND (julianday('now') - julianday(n.published_at)) * 24.0 <= ${HOT_DECAY_HOURS}
            ), 0),
            1.0
          )
        )
    )
    WHERE id = ?;
    `;

    db.prepare(sql).run(clusterId);
    return true;
  } catch (e) {
    console.error('updateClusterHotScore error:', e);
    return false;
  }
}

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
        AND ${REPORT_FILTER}
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
          c.hot_score * 1.0 +
          (strftime('%s','now') - strftime('%s', n.published_at)) * -0.00001
        ) AS featured_score

      FROM clusters c
      JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
        AND ${REPORT_FILTER}
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

        c.hot_score AS trending_score

      FROM clusters c
      JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
        AND ${REPORT_FILTER}
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
      WHERE ${REPORT_FILTER}
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
      WHERE n.cluster_id = ? AND ${REPORT_FILTER}
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
      WHERE cat.slug = ? AND ${REPORT_FILTER}
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
         AND ${REPORT_FILTER}
      ORDER BY
        COALESCE(c.hot_score, 0) DESC,
        n.published_at DESC
      LIMIT ?
    `;

    const params = [`%${safeQuery}%`, `%${safeQuery}%`];

    if (categoryId) {
      sql += ` AND n.category_id = ?`;
      params.push(categoryId);
    }

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

// =========================
// RECOMMENDATION SYSTEM
// =========================

export async function getUserPreferredCategories(userId, dayRange = 30) {
  try {
    if (!userId) return [];

    const sql = `
      SELECT
        n.category_id,
        cat.name AS category_name,
        cat.slug AS category_slug,

        COUNT(DISTINCT rl.news_id) AS read_count,
        COUNT(DISTINCT DATE(rl.read_at)) AS active_days,
        MAX(rl.read_at) AS last_read

      FROM read_logs rl
      JOIN news n ON n.id = rl.news_id
      JOIN categories cat ON cat.id = n.category_id

      WHERE rl.user_id = ?
        AND rl.read_at >= datetime('now', '-' || ? || ' days')

      GROUP BY n.category_id, cat.name, cat.slug

      ORDER BY
        read_count DESC,
        active_days DESC,
        last_read DESC

      LIMIT 5;
    `;

    return db.prepare(sql).all(userId, dayRange);
  } catch (error) {
    console.error('getUserPreferredCategories error:', error);
    return [];
  }
}


export async function getRecommendedClusters(userId = null, limit = 10, offset = 0) {
  try {
    if (!userId) {
      return await getHotClusters(limit, offset);
    }

    // 1. Lấy danh mục yêu thích
    const preferredCategories = await getUserPreferredCategories(userId, 30);

    if (preferredCategories.length === 0) {
      return await getHotClusters(limit, offset);
    }

    const topCategories = preferredCategories.slice(0, 5);
    const maxRead = topCategories[0].read_count;

    // Tăng trọng số cá nhân hóa để có tác động rõ rệt hơn
    const PERSONAL_WEIGHT = 2.0;

    const caseClauses = topCategories.map((c, index) => {
      const weight = (c.read_count / maxRead) * Math.exp(-index * 0.4) * PERSONAL_WEIGHT;
      return `WHEN c.category_id = ${c.category_id} THEN ${weight.toFixed(3)}`;
    }).join('\n');

    const sql = `
      SELECT
        c.id AS cluster_id,
        c.category_id,
        c.size,
        c.hot_score,

        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,

        cat.name AS category,
        cat.slug AS category_slug,

        -- CÔNG THỨC ĐỀ CỬ MỚI:
        (
          -- 1. Điểm cơ bản từ độ nóng
          c.hot_score * 1.5 + 
          
          -- 2. Điểm cộng từ sở thích danh mục
          CASE
            ${caseClauses}
            ELSE 0
          END +
          
          -- 3. Bonus cho tin có nhiều nguồn (size lớn)
          log(MAX(c.size, 1)) * 0.5
        ) 
        -- 4. Time Decay: Giảm 0.1 điểm cho mỗi giờ trôi qua kể từ khi xuất bản
        * exp(-(strftime('%s', 'now') - strftime('%s', n.published_at)) / 86400.0) 
        AS recommendation_score

      FROM clusters c
      LEFT JOIN categories cat ON cat.id = c.category_id
      JOIN news n ON n.id = (
        SELECT id
        FROM news
        WHERE cluster_id = c.id
          AND ${REPORT_FILTER}
          -- LỌC: Không hiện lại tin đã đọc
          AND id NOT IN (SELECT news_id FROM read_logs WHERE user_id = ?)
          -- LỌC: Không hiện tin đã báo cáo
          AND id NOT IN (SELECT news_id FROM reports WHERE user_id = ?)
        ORDER BY published_at DESC
        LIMIT 1
      )

      ORDER BY recommendation_score DESC
      LIMIT ? OFFSET ?;
    `;

    const clusters = db.prepare(sql).all(userId, userId, limit, offset);

    // Nếu sau khi lọc mà không đủ tin, có thể fallback về hot clusters (nhưng thường là đủ)
    if (clusters.length === 0 && offset === 0) {
      return await getHotClusters(limit, offset);
    }

    return cleanArrayForClient(clusters);

  } catch (error) {
    console.error('getRecommendedClusters error:', error);
    return await getHotClusters(limit, offset);
  }
}


// =========================
// USER READ HISTORY
// =========================
export async function getUserReadHistory(userId, page = 1, limit = 20) {
  try {
    if (!userId) {
      return [];
    }

    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        MAX(rl.id) AS read_log_id,
        MAX(rl.read_at) AS read_at,
        
        n.id AS news_id,
        n.title,
        n.url,
        n.image_url,
        n.summary,
        n.source,
        strftime('%Y-%m-%dT%H:%M:%S', n.published_at) AS published_at,
        
        cat.name AS category,
        cat.slug AS category_slug,
        
        c.id AS cluster_id,
        c.size,
        c.hot_score

      FROM read_logs rl
      JOIN news n ON n.id = rl.news_id
      LEFT JOIN categories cat ON cat.id = n.category_id
      LEFT JOIN clusters c ON c.id = n.cluster_id
      
      WHERE rl.user_id = ?
      
      GROUP BY n.id
      ORDER BY read_at DESC
      LIMIT ? OFFSET ?;
    `;

    const history = db.prepare(sql).all(userId, limit, offset);
    return cleanArrayForClient(history);
  } catch (error) {
    console.error('getUserReadHistory error:', error);
    return [];
  }
}
