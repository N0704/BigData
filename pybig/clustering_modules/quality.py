import numpy as np
from typing import Dict
from sklearn.metrics.pairwise import cosine_distances
from sklearn.neighbors import NearestNeighbors, LocalOutlierFactor
from scipy.spatial.distance import cdist

from config import MIN_SAMPLES, EPS

class ClusterQualityAnalyzer:
    """Analyze and improve cluster quality"""
    
    @staticmethod
    def compute_silhouette_score(points: np.ndarray, labels: np.ndarray) -> float:
        """Compute silhouette score for cluster validation"""
        from sklearn.metrics import silhouette_score
        
        if len(set(labels)) <= 1:
            return -1.0
            
        try:
            # Sample if too large for performance
            if len(points) > 10000:
                indices = np.random.choice(len(points), 10000, replace=False)
                points = points[indices]
                labels = labels[indices]
                
            return silhouette_score(points, labels, metric='cosine')
        except:
            return -1.0
    
    @staticmethod
    def compute_cluster_cohesion(points: np.ndarray, labels: np.ndarray) -> Dict[int, float]:
        """Compute cohesion for each cluster"""
        cohesion = {}
        
        for label in set(labels):
            if label == -1:
                continue
                
            cluster_points = points[labels == label]
            if len(cluster_points) < 2:
                cohesion[label] = 0.0
                continue
                
            # Compute average distance to centroid
            centroid = np.mean(cluster_points, axis=0)
            distances = cdist([centroid], cluster_points, metric='cosine')[0]
            cohesion[label] = 1.0 - np.mean(distances) / 2.0
            
        return cohesion
    
    @staticmethod
    def detect_outliers(points: np.ndarray, contamination: float = 0.1) -> np.ndarray:
        """Detect outliers using Local Outlier Factor"""
        if len(points) < 10:
            return np.zeros(len(points), dtype=bool)
            
        try:
            lof = LocalOutlierFactor(contamination=contamination, 
                                    metric='cosine', n_jobs=-1)
            outlier_labels = lof.fit_predict(points)
            return outlier_labels == -1
        except:
            return np.zeros(len(points), dtype=bool)

class DynamicParameterTuner:
    """Dynamically tune clustering parameters"""
    
    @staticmethod
    def estimate_optimal_eps(embeddings: np.ndarray, 
                           min_samples: int = None) -> float:
        """Estimate optimal EPS using k-distance graph"""
        if min_samples is None:
            min_samples = MIN_SAMPLES
            
        if len(embeddings) < min_samples * 2:
            return EPS
            
        # Compute k-distance
        nbrs = NearestNeighbors(n_neighbors=min_samples, 
                              metric='cosine', n_jobs=-1)
        nbrs.fit(embeddings)
        distances, _ = nbrs.kneighbors(embeddings)
        
        # Sort distances
        k_distances = np.sort(distances[:, -1])
        
        # Find elbow point
        try:
            from kneed import KneeLocator
            x = range(len(k_distances))
            kneedle = KneeLocator(x, k_distances, curve='convex', direction='increasing')
            if kneedle.knee:
                return float(k_distances[kneedle.knee])
        except:
            pass
            
        # Fallback: use percentile
        return float(np.percentile(k_distances, 75))
    
    @staticmethod
    def adaptive_min_samples(n_points: int, base_min_samples: int = None) -> int:
        """Adapt min_samples based on dataset size"""
        if base_min_samples is None:
            base_min_samples = MIN_SAMPLES
            
        if n_points < 100:
            return max(2, base_min_samples - 1)
        elif n_points > 10000:
            return min(base_min_samples + 3, 10)
        else:
            return base_min_samples
