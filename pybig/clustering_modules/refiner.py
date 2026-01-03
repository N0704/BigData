import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_distances
from sklearn.preprocessing import normalize

from db import cursor, conn, blob_to_vec, vec_to_blob
from config import MERGE_SIMILARITY_THRESHOLD
from hot_score import update_cluster_hot_score

class ClusterRefiner:
    """Refine clusters by merging and splitting - OPTIMIZED"""
    
    def __init__(self, similarity_threshold: float = MERGE_SIMILARITY_THRESHOLD):
        self.similarity_threshold = similarity_threshold
        
    def find_merge_candidates(self, clusters: List[Dict], 
                            embeddings_dict: Dict[int, np.ndarray] = None) -> List[Tuple[int, int]]:
        """Find clusters that should be merged - OPTIMIZED with NearestNeighbors"""
        n_clusters = len(clusters)
        if n_clusters < 2:
            return []
            
        candidates = []
        
        # OPTIMIZATION: Use NearestNeighbors instead of O(N²) loop
        centroids = np.array([c['centroid'] for c in clusters])
        ids = [c['id'] for c in clusters]
        created_ats = [c.get('created_at', datetime.utcnow()) for c in clusters]
        
        # Build KNN index
        n_neighbors = min(10, n_clusters)
        nbrs = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine', n_jobs=-1)
        nbrs.fit(centroids)
        distances, indices = nbrs.kneighbors(centroids)
        
        now = datetime.utcnow()
        seen_pairs = set()
        
        for i in range(n_clusters):
            c1_id = ids[i]
            age1 = now - created_ats[i]
            
            if age1 < timedelta(hours=2):
                continue
                
            for j_idx, neighbor_idx in enumerate(indices[i]):
                if i == neighbor_idx:
                    continue
                    
                c2_id = ids[neighbor_idx]
                
                # Avoid duplicates
                pair = tuple(sorted((c1_id, c2_id)))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                
                age2 = now - created_ats[neighbor_idx]
                if age2 < timedelta(hours=2):
                    continue
                    
                # Convert distance to similarity
                sim = 1.0 - distances[i][j_idx]
                
                if sim >= self.similarity_threshold:
                    candidates.append((c1_id, c2_id, sim))
        
        # Sort by similarity descending
        candidates.sort(key=lambda x: x[2], reverse=True)
        return [(c1, c2) for c1, c2, _ in candidates[:5]]  # Top 5 candidates
    
    def merge_clusters(self, cluster_id1: int, cluster_id2: int):
        """Merge two clusters"""
        # Get cluster data
        cursor.execute("SELECT centroid, size FROM clusters WHERE id IN (?, ?)", 
                      (cluster_id1, cluster_id2))
        rows = cursor.fetchall()
        
        if len(rows) != 2:
            return
            
        centroid1, size1 = blob_to_vec(rows[0][0]), rows[0][1]
        centroid2, size2 = blob_to_vec(rows[1][0]), rows[1][1]
        
        # Compute new centroid (weighted average)
        new_centroid = normalize(
            ((centroid1 * size1 + centroid2 * size2) / (size1 + size2)).reshape(1, -1)
        )[0]
        
        # Update first cluster
        cursor.execute("""
            UPDATE clusters 
            SET centroid = ?, size = ?, last_update = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (vec_to_blob(new_centroid), size1 + size2, cluster_id1))
        
        # Move articles from second cluster to first
        cursor.execute("""
            UPDATE news 
            SET cluster_id = ? 
            WHERE cluster_id = ?
        """, (cluster_id1, cluster_id2))
        
        # Delete second cluster
        cursor.execute("DELETE FROM clusters WHERE id = ?", (cluster_id2,))
        
        update_cluster_hot_score(cluster_id1)
        conn.commit()
    
    def split_heterogeneous_cluster(self, cluster_id: int, 
                                  embeddings: np.ndarray,
                                  labels: np.ndarray):
        """Split a heterogeneous cluster into subclusters"""
        if len(set(labels)) <= 1:
            return
            
        # Create new clusters for each subcluster
        for new_label in set(labels):
            if new_label == -1:
                continue
                
            idxs = np.where(labels == new_label)[0]
            sub_embeddings = embeddings[idxs]
            
            if len(sub_embeddings) < 2:
                continue
                
            # Create new cluster
            centroid = normalize(np.mean(sub_embeddings, axis=0).reshape(1, -1))[0]
            # Note: create_cluster function needs to be imported
            
        # Mark original cluster as split
        cursor.execute("UPDATE clusters SET status = 'split' WHERE id = ?", (cluster_id,))
