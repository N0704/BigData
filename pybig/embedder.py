import os
import threading
import numpy as np
from typing import List, Union
from sentence_transformers import SentenceTransformer

# ==================================================
# GLOBALS
# ==================================================
_model = None
_model_lock = threading.Lock()

DEFAULT_MODEL = "bkai-foundation-models/vietnamese-bi-encoder"
FALLBACK_MODEL = "intfloat/multilingual-e5-base"

DEVICE = "cuda" if os.environ.get("USE_GPU", "0") == "1" else "cpu"


# ==================================================
# MODEL LOADER
# ==================================================
def get_model() -> SentenceTransformer:
    """
    Thread-safe lazy loading of embedding model
    """
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:
            return _model

        try:
            _model = SentenceTransformer(DEFAULT_MODEL, device=DEVICE)
            print(f"✓ Loaded Vietnamese model: {DEFAULT_MODEL} ({DEVICE})")
        except Exception as e:
            print(f"⚠ Failed to load Vietnamese model: {e}")
            _model = SentenceTransformer(FALLBACK_MODEL, device=DEVICE)
            print(f"✓ Loaded fallback model: {FALLBACK_MODEL} ({DEVICE})")

    return _model


# ==================================================
# SAFE NORMALIZATION
# ==================================================
def _safe_normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    norms[norms == 0] = 1e-8
    return vectors / norms


# ==================================================
# EMBEDDING API
# ==================================================
def embed(
    text: Union[str, List[str]],
    batch_size: int = 32,
    normalize: bool = True
) -> np.ndarray:
    """
    Generate embeddings for text or list of texts
    Optimized for cosine-based clustering
    """

    model = get_model()

    if isinstance(text, str):
        vec = model.encode(
            text,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        if normalize:
            vec = _safe_normalize(vec.reshape(1, -1))[0]
        return vec

    if not text:
        return np.empty((0, model.get_sentence_embedding_dimension()))

    vectors = model.encode(
        text,
        batch_size=batch_size,
        show_progress_bar=False,
        convert_to_numpy=True
    )

    if normalize:
        vectors = _safe_normalize(vectors)

    return vectors
