import numpy as np
from typing import List, Dict, Any, Tuple
from collections import Counter
from sklearn.cluster import DBSCAN, OPTICS, MiniBatchKMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

try:
    import hdbscan
    HDBSCAN_AVAILABLE = True
except ImportError:
    HDBSCAN_AVAILABLE = False

from config import (
    SIM_THRESHOLD,
    MIN_SAMPLES,
    EPS,
    USE_HDBSCAN,
    DYNAMIC_EPS_ENABLED
)

from .utils import TextFeatureExtractor
from .embeddings import EmbeddingEnhancer
from .quality import ClusterQualityAnalyzer, DynamicParameterTuner

try:
    from underthesea import ner
    NER_AVAILABLE = True
except ImportError:
    NER_AVAILABLE = False


# ======================================================
# MAIN CLUSTERING
# ======================================================
def enhanced_batch_cluster_algo(
    embeddings: np.ndarray,
    texts: List[str] = None,
    category_id: int = None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Production-safe batch clustering for news/event data
    """

    # --------------------------------------------------
    # 1. Normalize embeddings (required for cosine)
    # --------------------------------------------------
    embeddings = normalize(embeddings)

    # --------------------------------------------------
    # 2. Optional text enhancement (small batch only)
    # --------------------------------------------------
    extractor = TextFeatureExtractor()
    enhancer = EmbeddingEnhancer(use_pca=embeddings.shape[1] > 100)

    if embeddings.shape[1] > 100:
        embeddings = enhancer.reduce_dimensionality(embeddings)

    if texts and NER_AVAILABLE and len(embeddings) <= 5000:
        embeddings = enhancer.add_text_features(
            embeddings,
            texts,
            extractor
        )

    # --------------------------------------------------
    # 3. Dynamic parameters
    # --------------------------------------------------
    if DYNAMIC_EPS_ENABLED:
        eps = DynamicParameterTuner.estimate_optimal_eps(embeddings)
        min_samples = DynamicParameterTuner.adaptive_min_samples(len(embeddings))
    else:
        eps = EPS
        min_samples = MIN_SAMPLES

    print(f"[Cluster] eps={eps:.4f}, min_samples={min_samples}")

    cluster_results: Dict[str, Any] = {}

    # --------------------------------------------------
    # 4. Algorithm selection
    # --------------------------------------------------
    if len(embeddings) > 100_000:
        # LAST RESORT
        n_clusters = max(200, len(embeddings) // 6)
        model = MiniBatchKMeans(
            n_clusters=n_clusters,
            batch_size=4096,
            n_init=3,
            random_state=42
        )
        labels = model.fit_predict(embeddings)
        cluster_results["algorithm"] = "minibatch_kmeans"

    elif USE_HDBSCAN and HDBSCAN_AVAILABLE and len(embeddings) >= 50:
        model = hdbscan.HDBSCAN(
            min_cluster_size=min_samples,
            min_samples=min_samples,
            metric="cosine",
            cluster_selection_method="leaf",  # leaf cho cụm nhỏ và chi tiết hơn
            prediction_data=False
        )
        labels = model.fit_predict(embeddings)
        cluster_results["algorithm"] = "hdbscan"

    elif len(embeddings) >= 500:
        model = OPTICS(
            min_samples=min_samples,
            metric="cosine",
            cluster_method="xi",
            n_jobs=-1
        )
        labels = model.fit_predict(embeddings)
        cluster_results["algorithm"] = "optics"

    else:
        model = DBSCAN(
            eps=eps,
            min_samples=min_samples,
            metric="cosine",
            n_jobs=-1
        )
        labels = model.fit_predict(embeddings)
        cluster_results["algorithm"] = "dbscan"

    # --------------------------------------------------
    # 5. Merge small clusters (CENTROID BASED)
    # --------------------------------------------------
    labels = _merge_small_clusters(
        embeddings,
        labels,
        min_samples,
        SIM_THRESHOLD
    )

    # --------------------------------------------------
    # 6. Quality metrics (safe)
    # --------------------------------------------------
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = int(np.sum(labels == -1))

    if n_clusters >= 2:
        quality = ClusterQualityAnalyzer.compute_silhouette_score(
            embeddings,
            labels
        )
    else:
        quality = -1.0

    cluster_results.update({
        "n_clusters": n_clusters,
        "n_noise": n_noise,
        "quality_score": quality
    })

    print(
        f"[Cluster] {n_clusters} clusters | "
        f"{n_noise} noise | quality={quality:.3f}"
    )

    return labels, cluster_results


# ======================================================
# HELPERS
# ======================================================
def _merge_small_clusters(
    embeddings: np.ndarray,
    labels: np.ndarray,
    min_samples: int,
    sim_threshold: float
) -> np.ndarray:
    """
    Merge clusters smaller than min_samples into nearest
    larger cluster using centroid similarity.
    """

    cluster_sizes = Counter(labels)
    small_clusters = {
        c for c, s in cluster_sizes.items()
        if 0 < s < min_samples
    }

    if not small_clusters:
        return labels

    # Precompute centroids
    centroids = {}
    for c in set(labels):
        if c == -1:
            continue
        idxs = np.where(labels == c)[0]
        centroids[c] = np.mean(embeddings[idxs], axis=0)

    for c in small_clusters:
        c_centroid = centroids[c]

        best_label = -1
        best_sim = sim_threshold + 0.05  # stricter

        for other_c, other_centroid in centroids.items():
            if other_c == c or other_c in small_clusters:
                continue

            sim = cosine_similarity(
                c_centroid.reshape(1, -1),
                other_centroid.reshape(1, -1)
            )[0][0]

            if sim > best_sim:
                best_sim = sim
                best_label = other_c

        if best_label != -1:
            labels[labels == c] = best_label
        else:
            labels[labels == c] = -1

    return labels

def batch_cluster_algo(
    embeddings: np.ndarray,
    texts: List[str] = None
) -> np.ndarray:
    """
    Legacy API wrapper.
    Keep for compatibility with old pipeline & imports.
    """
    labels, _ = enhanced_batch_cluster_algo(
        embeddings=embeddings,
        texts=texts
    )
    return labels