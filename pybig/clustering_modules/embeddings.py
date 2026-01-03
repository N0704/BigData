import numpy as np
from typing import List
from sklearn.preprocessing import normalize
from sklearn.decomposition import PCA, IncrementalPCA


class EmbeddingEnhancer:


    def __init__(
        self,
        use_pca: bool = True,
        n_components: int = 64,
        pca_threshold: int = 128
    ):
        self.use_pca = use_pca
        self.n_components = n_components
        self.pca_threshold = pca_threshold
        self.pca = None

    # ==================================================
    # TEXT-AWARE REWEIGHTING (NOT CONCATENATION)
    # ==================================================
    def add_text_features(
        self,
        embeddings: np.ndarray,
        texts: List[str],
        extractor
    ) -> np.ndarray:
        """
        Light semantic re-weighting based on keyword overlap.
        Does NOT change embedding dimensionality.
        """

        if not texts or len(embeddings) > 5000:
            return embeddings

        keyword_sets = [
            set(extractor.extract_keywords(t))
            for t in texts
        ]

        # Compute keyword overlap matrix (cheap & safe)
        n = len(embeddings)
        weights = np.ones(n)

        for i in range(n):
            if not keyword_sets[i]:
                continue
            overlap = sum(
                len(keyword_sets[i] & keyword_sets[j])
                for j in range(n)
                if i != j
            )
            weights[i] += overlap * 0.01  # VERY small influence

        embeddings = embeddings * weights[:, None]
        return embeddings

    # ==================================================
    # DIMENSION REDUCTION (CLUSTER SAFE)
    # ==================================================
    def reduce_dimensionality(self, embeddings: np.ndarray) -> np.ndarray:
        """
        PCA only when dimensionality is too high.
        Keeps cosine structure intact.
        """

        n_samples, n_features = embeddings.shape

        if not self.use_pca or n_features <= self.pca_threshold:
            return embeddings

        n_components = min(
            self.n_components,
            n_samples - 1,
            n_features
        )

        if n_components < 2:
            return embeddings

        if n_samples > 10000:
            if not isinstance(self.pca, IncrementalPCA) or \
               self.pca.n_components != n_components:
                self.pca = IncrementalPCA(
                    n_components=n_components,
                    batch_size=2048
                )
                reduced = self.pca.fit_transform(embeddings)
            else:
                reduced = self.pca.transform(embeddings)
        else:
            if not isinstance(self.pca, PCA) or \
               self.pca.n_components != n_components:
                self.pca = PCA(
                    n_components=n_components,
                    random_state=42
                )
                reduced = self.pca.fit_transform(embeddings)
            else:
                reduced = self.pca.transform(embeddings)

        return reduced

    # ==================================================
    # FINAL STEP
    # ==================================================
    def finalize(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Normalize once, at the end.
        """
        return normalize(embeddings)
