import numpy as np
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict
from sklearn.preprocessing import normalize
from sklearn.neighbors import NearestNeighbors

# Import optimized clustering modules
from clustering_modules import (
    enhanced_batch_cluster_algo,
    batch_cluster_algo,
    ClusterRefiner,
    ClusterQualityAnalyzer
)

from db import cursor, conn, blob_to_vec, vec_to_blob
from config import (
    SIM_THRESHOLD,
    MIN_SAMPLES,
    BATCH_CLUSTERING_THRESHOLD,
    K_NEIGHBORS,
    CLUSTER_QUALITY_THRESHOLD
)
from hot_score import update_cluster_hot_score

# ==================================================
# DATABASE HELPERS
# ==================================================
def create_cluster(category_id: int, centroid: np.ndarray, size: int) -> int:
    """Create a new cluster in database"""
    cursor.execute("""
        INSERT INTO clusters (category_id, centroid, size)
        VALUES (?, ?, ?)
    """, (category_id, vec_to_blob(centroid), size))
    cid = cursor.lastrowid
    update_cluster_hot_score(cid)
    return cid

def update_cluster(cluster_id: int, centroid: np.ndarray, size: int):
    """Update existing cluster"""
    cursor.execute("""
        UPDATE clusters
        SET centroid = ?, size = ?, last_update = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (vec_to_blob(centroid), size, cluster_id))
    update_cluster_hot_score(cluster_id)

def load_clusters(category_id: int) -> List[Dict]:
    """Load clusters from database"""
    cursor.execute("""
        SELECT id, centroid, size, created_at
        FROM clusters
        WHERE category_id = ?
    """, (category_id,))

    clusters = []
    for cid, centroid, size, created_at in cursor.fetchall():
        clusters.append({
            "id": cid,
            "centroid": normalize(blob_to_vec(centroid).reshape(1, -1))[0],
            "size": size,
            "created_at": datetime.fromisoformat(created_at)
        })
    return clusters

def build_knn_index(clusters: List[Dict]) -> Optional[NearestNeighbors]:
    """Build KNN index for clusters"""
    if not clusters:
        return None

    X = np.array([c["centroid"] for c in clusters])

    knn = NearestNeighbors(
        n_neighbors=min(K_NEIGHBORS, len(clusters)),
        metric="cosine",
        algorithm="brute"
    )
    knn.fit(X)
    return knn

def assign_cluster(
    vec: np.ndarray,
    clusters: List[Dict],
    knn: NearestNeighbors
) -> Optional[Dict]:
    """Assign vector to nearest cluster"""
    if knn is None:
        return None

    vec = normalize(vec.reshape(1, -1))[0]
    distances, indices = knn.kneighbors([vec])
    sims = 1.0 - distances[0]

    now = datetime.utcnow()
    best = None
    best_sim = 0.0

    for i, idx in enumerate(indices[0]):
        c = clusters[idx]

        # Prevent drift
        if now - c["created_at"] > timedelta(hours=48):
            continue

        sim = sims[i]
        if sim >= SIM_THRESHOLD and sim > best_sim:
            best = c
            best_sim = sim

    return best

# ==================================================
# BATCH CLUSTERING
# ==================================================
def batch_cluster_articles(
    articles: List[Dict],
    category_id: int
) -> Dict[int, int]:
    """Batch clustering function - OPTIMIZED"""
    
    embeddings = np.array([a["embedding"] for a in articles])
    
    # Extract text for NER (title + summary)
    texts = []
    for a in articles:
        t = a.get("title", "") + ". " + a.get("summary", "")
        texts.append(t)
        
    labels = batch_cluster_algo(embeddings, texts)

    result = {}

    for label in set(labels):
        if label == -1:
            continue

        idxs = np.where(labels == label)[0]

        centroid = normalize(
            np.mean(embeddings[idxs], axis=0).reshape(1, -1)
        )[0]

        cluster_id = create_cluster(category_id, centroid, len(idxs))

        for i in idxs:
            result[i] = cluster_id

    return result

# ==================================================
# ENHANCED HYBRID CLUSTERING
# ==================================================
def enhanced_hybrid_cluster_articles(
    articles: List[Dict],
    category_id: int,
    enable_refinement: bool = True
):
    """Enhanced hybrid clustering - OPTIMIZED"""
    if not articles:
        return
    
    print(f"⚡ Clustering {len(articles)} articles in category {category_id}")
    
    # Batch clustering for large datasets
    if len(articles) >= BATCH_CLUSTERING_THRESHOLD:
        print(f"  Using batch clustering...")
    
    clusters = load_clusters(category_id)
    knn = build_knn_index(clusters)
    
    # Group articles by similarity for batch updates
    article_groups = defaultdict(list)
    
    for art in articles:
        vec = normalize(art["embedding"].reshape(1, -1))[0]
        cluster = assign_cluster(vec, clusters, knn)
        
        if cluster:
            article_groups[cluster["id"]].append((art["id"], vec))
        else:
            # New cluster
            cid = create_cluster(category_id, vec, 1)
            clusters.append({
                "id": cid,
                "centroid": vec,
                "size": 1,
                "created_at": datetime.utcnow()
            })
            knn = build_knn_index(clusters)
            cursor.execute(
                "UPDATE news SET cluster_id=? WHERE id=?",
                (cid, art["id"])
            )
    
    # Batch update clusters
    for cluster_id, items in article_groups.items():
        if not items:
            continue
            
        cluster = next((c for c in clusters if c["id"] == cluster_id), None)
        if not cluster:
            continue
            
        # Update centroid with all new points at once
        size = cluster["size"]
        centroid = cluster["centroid"]
        
        # Weighted update
        new_vecs = np.array([vec for _, vec in items])
        avg_new_vec = normalize(np.mean(new_vecs, axis=0).reshape(1, -1))[0]
        
        # Exponential moving average for stability
        alpha = 0.7
        new_centroid = normalize(
            (alpha * centroid + (1 - alpha) * avg_new_vec).reshape(1, -1)
        )[0]
        
        # Update cluster
        new_size = size + len(items)
        update_cluster(cluster_id, new_centroid, new_size)
        
        # Update cluster in local list
        cluster["centroid"] = new_centroid
        cluster["size"] = new_size
        
        # Update articles
        for article_id, _ in items:
            cursor.execute(
                "UPDATE news SET cluster_id=? WHERE id=?",
                (cluster_id, article_id)
            )
    
    conn.commit()

# ==================================================
# CLUSTER REFINEMENT
# ==================================================
def perform_cluster_refinement(category_id: int):
    """Perform post-clustering refinement - OPTIMIZED"""
    print(f"⚡ Refining clusters for category {category_id}")
    
    # Load all clusters and their articles
    cursor.execute("""
        SELECT c.id, c.centroid, c.size, c.created_at,
               n.id, n.embedding, n.title, n.summary
        FROM clusters c
        LEFT JOIN news n ON c.id = n.cluster_id
        WHERE c.category_id = ? AND n.embedding IS NOT NULL
        ORDER BY c.id
    """, (category_id,))
    
    rows = cursor.fetchall()
    
    if not rows:
        return
    
    # Group by cluster
    cluster_data = defaultdict(list)
    clusters_info = {}
    
    for row in rows:
        cluster_id, centroid_blob, size, created_at, art_id, emb_blob, title, summary = row
        
        if cluster_id not in clusters_info:
            clusters_info[cluster_id] = {
                'id': cluster_id,
                'centroid': blob_to_vec(centroid_blob),
                'size': size,
                'created_at': datetime.fromisoformat(created_at),
                'articles': []
            }
        
        cluster_data[cluster_id].append({
            'id': art_id,
            'embedding': blob_to_vec(emb_blob),
            'title': title,
            'summary': summary
        })
    
    # Analyze each cluster
    refiner = ClusterRefiner()
    
    for cluster_id, info in clusters_info.items():
        articles = cluster_data.get(cluster_id, [])
        
        if len(articles) < 2:
            continue
        
        embeddings = np.array([a['embedding'] for a in articles])
        
        # Check cluster cohesion
        analyzer = ClusterQualityAnalyzer()
        cohesion = analyzer.compute_cluster_cohesion(embeddings, np.zeros(len(embeddings)))
        
        if cohesion.get(0, 0) < CLUSTER_QUALITY_THRESHOLD:
            print(f"  Cluster {cluster_id} has low cohesion: {cohesion[0]:.3f}")
            
            # Try to split if large enough
            if len(articles) >= 10:
                # Run sub-clustering
                sub_labels, _ = enhanced_batch_cluster_algo(
                    embeddings, 
                    [a['title'] + ' ' + a.get('summary', '') for a in articles]
                )
                
                if len(set(sub_labels)) > 1:
                    print(f"  Splitting cluster {cluster_id}...")
                    refiner.split_heterogeneous_cluster(
                        cluster_id, embeddings, sub_labels
                    )
    
    # Find merge candidates
    all_clusters = list(clusters_info.values())
    if len(all_clusters) > 1:
        merge_candidates = refiner.find_merge_candidates(all_clusters)
        
        for cid1, cid2 in merge_candidates[:3]:
            print(f"  Merging clusters {cid1} and {cid2}")
            refiner.merge_clusters(cid1, cid2)

# ==================================================
# ENHANCED RECLUSTERING
# ==================================================
def recluster_category_safe(
    category_id: int,
    full_optimization: bool = True
) -> Dict[str, Any]:

    print(f"⚡ Reclustering category {category_id} (safe mode)")

    cursor.execute("""
        SELECT id, embedding, title, summary, published_at
        FROM news
        WHERE category_id = ?
          AND embedding IS NOT NULL
        ORDER BY published_at DESC
        LIMIT 10000
    """, (category_id,))

    rows = cursor.fetchall()
    if not rows:
        return {"status": "no_articles", "clusters_created": 0}

    # ─────────────────────────────
    # 1️⃣ Load & validate articles
    # ─────────────────────────────
    articles = []
    for r in rows:
        nid, emb_blob, title, summary, published_at = r
        vec = safe_vec(blob_to_vec(emb_blob))
        if vec is None:
            continue

        articles.append({
            "id": nid,
            "embedding": vec,
            "text": f"{title or ''}. {summary or ''}",
            "published_at": published_at
        })

    if not articles:
        return {"status": "no_valid_embeddings", "clusters_created": 0}

    print(f"  ✓ Valid articles: {len(articles)}")

    recluster_tag = f"re_{category_id}_{int(time.time())}"

    cursor.execute("""
        ALTER TABLE clusters ADD COLUMN recluster_tag TEXT
    """)  # ignore if exists
    conn.commit()

    cluster_map = {}
    total_clusters = 0

    for i in range(0, len(articles), CHUNK_SIZE):
        chunk = articles[i:i + CHUNK_SIZE]
        print(f"  ▶ Chunk {i//CHUNK_SIZE + 1}")

        embeddings = np.vstack([a["embedding"] for a in chunk])
        texts = [a["text"] for a in chunk]

        labels, _ = enhanced_batch_cluster_algo(
            embeddings, texts, category_id
        )

        for label in set(labels):
            if label == -1:
                continue

            idxs = np.where(labels == label)[0]
            vecs = embeddings[idxs]

            centroid = normalize(
                np.mean(vecs, axis=0).reshape(1, -1)
            )[0]

            cid = create_cluster(
                category_id,
                centroid,
                size=len(idxs),
                recluster_tag=recluster_tag
            )
            total_clusters += 1

            for idx in idxs:
                aid = chunk[idx]["id"]
                cluster_map[aid] = cid
                cursor.execute(
                    "UPDATE news SET cluster_id=? WHERE id=?",
                    (cid, aid)
                )

        conn.commit()

    # ─────────────────────────────
    # 4️⃣ Handle noise (KNN assign)
    # ─────────────────────────────
    noise = [a for a in articles if a["id"] not in cluster_map]

    if noise:
        print(f"  ▶ Assigning {len(noise)} noise points")

        clusters = load_clusters(category_id)
        knn = build_knn_index(clusters) if clusters else None

        for a in noise:
            vec = normalize(a["embedding"].reshape(1, -1))[0]
            cluster = assign_cluster(vec, clusters, knn)

            if cluster:
                cid = cluster["id"]
                cursor.execute("""
                    UPDATE clusters
                    SET size = size + 1,
                        last_update = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (cid,))
            else:
                cid = create_cluster(
                    category_id, vec, 1, recluster_tag=recluster_tag
                )
                total_clusters += 1

            cursor.execute(
                "UPDATE news SET cluster_id=? WHERE id=?",
                (cid, a["id"])
            )

        conn.commit()

    # ─────────────────────────────
    # 5️⃣ Swap old clusters safely
    # ─────────────────────────────
    cursor.execute("""
        DELETE FROM clusters
        WHERE category_id = ?
          AND recluster_tag IS NULL
    """, (category_id,))

    cursor.execute("""
        UPDATE clusters
        SET recluster_tag = NULL
        WHERE recluster_tag = ?
    """, (recluster_tag,))

    conn.commit()

    # ─────────────────────────────
    # 6️⃣ Optional refinement
    # ─────────────────────────────
    if full_optimization:
        perform_cluster_refinement(category_id)

    return {
        "status": "success",
        "articles": len(articles),
        "clusters_created": total_clusters
    }

# ==================================================
# MAIN ENTRY POINTS
# ==================================================
def hybrid_cluster_articles(
    articles: List[Dict],
    category_id: int,
    use_enhanced: bool = True
):
    """Main clustering function - OPTIMIZED"""
    if use_enhanced:
        return enhanced_hybrid_cluster_articles(articles, category_id, enable_refinement=True)
    else:
        # Original implementation for backward compatibility
        if not articles:
            return
        
        if len(articles) >= BATCH_CLUSTERING_THRESHOLD:
            cluster_map = batch_cluster_articles(articles, category_id)
            
            for i, art in enumerate(articles):
                cid = cluster_map.get(i)
                if cid is None:
                    vec = normalize(art["embedding"].reshape(1, -1))[0]
                    cid = create_cluster(category_id, vec, 1)
                
                cursor.execute(
                    "UPDATE news SET cluster_id=? WHERE id=?",
                    (cid, art["id"])
                )
            
            conn.commit()
            return
        
        clusters = load_clusters(category_id)
        knn = build_knn_index(clusters)
        
        for art in articles:
            vec = normalize(art["embedding"].reshape(1, -1))[0]
            cluster = assign_cluster(vec, clusters, knn)
            
            if cluster is None:
                cid = create_cluster(category_id, vec, 1)
                clusters.append({
                    "id": cid,
                    "centroid": vec,
                    "size": 1,
                    "created_at": datetime.utcnow()
                })
                knn = build_knn_index(clusters)
                cid_to_use = cid
            else:
                size = cluster["size"]
                centroid = cluster["centroid"]
                
                new_centroid = normalize(
                    ((centroid * size + vec) / (size + 1)).reshape(1, -1)
                )[0]
                
                update_cluster(cluster["id"], new_centroid, size + 1)
                cluster["centroid"] = new_centroid
                cluster["size"] += 1
                cid_to_use = cluster["id"]
            
            cursor.execute(
                "UPDATE news SET cluster_id=? WHERE id=?",
                (cid_to_use, art["id"])
            )
        
        conn.commit()

def recluster_category(category_id: int, enhanced: bool = True) -> Dict[str, Any]:
    """Recluster category - OPTIMIZED"""
    if enhanced:
        return enhanced_recluster_category(category_id, full_optimization=True)
    else:
        # Original implementation
        cursor.execute("""
            SELECT id, embedding, title, summary
            FROM news
            WHERE category_id = ? AND embedding IS NOT NULL
        """, (category_id,))
        
        rows = cursor.fetchall()
        if not rows:
            return {"clusters_created": 0, "articles": 0}
        
        article_ids = [r[0] for r in rows]
        articles = [
            {
                "embedding": blob_to_vec(r[1]),
                "title": r[2],
                "summary": r[3]
            } 
            for r in rows
        ]
        
        cursor.execute("DELETE FROM clusters WHERE category_id = ?", (category_id,))
        cursor.execute("UPDATE news SET cluster_id = NULL WHERE category_id = ?", (category_id,))
        conn.commit()
        
        cluster_map = batch_cluster_articles(articles, category_id)
        
        for i, aid in enumerate(article_ids):
            cid = cluster_map.get(i)
            if cid is None:
                vec = normalize(articles[i]["embedding"].reshape(1, -1))[0]
                cid = create_cluster(category_id, vec, 1)
            
            cursor.execute(
                "UPDATE news SET cluster_id=? WHERE id=?",
                (cid, aid)
            )
        
        conn.commit()
        
        return {
            "clusters_created": len(set(cluster_map.values())),
            "articles": len(article_ids)
        }

# ==================================================
# UTILITY FUNCTIONS
# ==================================================
def get_cluster_statistics(category_id: int = None) -> Dict[str, Any]:
    """Get detailed statistics about clusters"""
    if category_id:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_clusters,
                SUM(size) as total_articles,
                AVG(size) as avg_cluster_size,
                MIN(size) as min_size,
                MAX(size) as max_size,
                COUNT(CASE WHEN size = 1 THEN 1 END) as singleton_clusters,
                COUNT(CASE WHEN size >= 10 THEN 1 END) as large_clusters
            FROM clusters
            WHERE category_id = ?
        """, (category_id,))
    else:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_clusters,
                SUM(size) as total_articles,
                AVG(size) as avg_cluster_size,
                MIN(size) as min_size,
                MAX(size) as max_size,
                COUNT(CASE WHEN size = 1 THEN 1 END) as singleton_clusters,
                COUNT(CASE WHEN size >= 10 THEN 1 END) as large_clusters
            FROM clusters
        """)
    
    stats = cursor.fetchone()
    
    return {
        "total_clusters": stats[0],
        "total_articles": stats[1],
        "avg_cluster_size": float(stats[2]) if stats[2] else 0,
        "min_cluster_size": stats[3],
        "max_cluster_size": stats[4],
        "singleton_clusters": stats[5],
        "large_clusters": stats[6]
    }

if __name__ == "__main__":
    print("⚡ OPTIMIZED Clustering module initialized successfully.")
    print("📦 Modular architecture for large-scale data processing")
