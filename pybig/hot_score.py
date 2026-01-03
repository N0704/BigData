from db import cursor, conn
from config import HOT_DECAY_HOURS

# =========================
# SHARED SQL FORMULA
# =========================
HOT_SCORE_SQL = f"""
    (
        -- Base score by cluster size
        CASE
            WHEN size = 1 THEN 0.3
            WHEN size = 2 THEN 1.0
            ELSE LOG(size + 1) * 2.5
        END
    )
    *
    -- Time decay (hours)
    EXP(
        -(
            (julianday('now') - julianday(COALESCE(last_update, created_at)))
            * 24.0
            / ?
        )
    )
    *
    -- Recent activity boost (clamped)
    (
        1.0 + MIN(
            COALESCE((
                SELECT COUNT(*) * 0.1
                FROM news n
                WHERE n.cluster_id = clusters.id
                AND (julianday('now') - julianday(n.published_at)) * 24.0 <= ?
            ), 0),
            1.0
        )
    )
"""
def update_hot_scores():
    cursor.execute(f"""
        UPDATE clusters
        SET hot_score = {HOT_SCORE_SQL}
    """, (HOT_DECAY_HOURS, HOT_DECAY_HOURS))

    conn.commit()

def update_cluster_hot_score(cluster_id: int):
    cursor.execute(f"""
        UPDATE clusters
        SET hot_score = {HOT_SCORE_SQL}
        WHERE id = ?
    """, (HOT_DECAY_HOURS, HOT_DECAY_HOURS, cluster_id))

    conn.commit()
