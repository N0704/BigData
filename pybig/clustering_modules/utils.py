import numpy as np
from typing import List, Dict, Set
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity, cosine_distances
from sklearn.preprocessing import normalize

try:
    from underthesea import ner, word_tokenize, pos_tag
    NER_AVAILABLE = True
except ImportError:
    NER_AVAILABLE = False

class TextFeatureExtractor:
    """Extract advanced text features for better clustering - OPTIMIZED"""
    
    def __init__(self, max_cache_size: int = 10000):
        self.keyword_cache = {}
        self.max_cache_size = max_cache_size
        
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords using POS tagging"""
        if not text or not NER_AVAILABLE:
            return []
            
        if text in self.keyword_cache:
            return self.keyword_cache[text]
            
        try:
            pos_tags = pos_tag(text)
            
            keywords = []
            # Comprehensive Vietnamese stopwords
            stopwords = {
                'và', 'của', 'trong', 'để', 'với', 'các', 'những', 'này', 'khi', 'như',
                'là', 'có', 'được', 'cho', 'về', 'ở', 'nhưng', 'mà', 'theo', 'tại',
                'từ', 'lại', 'sẽ', 'đã', 'cũng', 'nhiều', 'người', 'đến', 'lên', 'ra',
                'vào', 'vì', 'do', 'rất', 'còn', 'thì', 'nên', 'phải', 'bị', 'bởi',
                'chỉ', 'cách', 'cùng', 'việc', 'sau', 'trước', 'khi', 'qua', 'giữa',
                'đang', 'mới', 'chưa', 'thấy', 'làm', 'hơn', 'hết', 'ngày', 'tháng', 'năm', 'chính sách'
            }
            
            for word, tag in pos_tags:
                # Prioritize Proper Nouns (Np), Nouns (N), Verbs (V), Adjectives (A)
                if tag == 'Np' or (tag.startswith(('N', 'V', 'A')) and len(word) > 1):
                    w_lower = word.lower()
                    if w_lower not in stopwords and not w_lower.isnumeric():
                        keywords.append(w_lower)
            
            # Remove duplicates while preserving order
            seen = set()
            keywords = [x for x in keywords if not (x in seen or seen.add(x))]
            
            return keywords[:max_keywords]
        except Exception:
            return []
    
    def extract_named_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities grouped by type"""
        if not NER_AVAILABLE or not text:
            return {}
            
        try:
            entities = ner(text)
            grouped = defaultdict(list)
            
            for word, _, _, label in entities:
                if label in ['B-PER', 'I-PER']:
                    grouped['PERSON'].append(word.lower())
                elif label in ['B-LOC', 'I-LOC']:
                    grouped['LOCATION'].append(word.lower())
                elif label in ['B-ORG', 'I-ORG']:
                    grouped['ORGANIZATION'].append(word.lower())
                    
            return dict(grouped)
        except Exception:
            return {}

class AdvancedDistanceMetrics:
    """Advanced distance metrics for clustering - OPTIMIZED"""
    
    @staticmethod
    def adaptive_cosine_distance(vec1: np.ndarray, vec2: np.ndarray,
                               variance_weight: float = 0.1) -> float:
        """Cosine distance with variance-based weighting"""
        cos_sim = cosine_similarity([vec1], [vec2])[0][0]
        cos_dist = 1 - cos_sim
        
        norm_diff = abs(np.linalg.norm(vec1) - np.linalg.norm(vec2))
        weighted_dist = cos_dist + variance_weight * norm_diff
        
        return min(weighted_dist, 1.0)

def extract_entities(text: str) -> Set[str]:
    """Extract entities from text using underthesea"""
    if not NER_AVAILABLE or not text:
        return set()
    
    try:
        entities = set()
        for word, pos, chunk, label in ner(text):
            if label in ['B-PER', 'I-PER', 'B-LOC', 'I-LOC']:
                entities.add(word.lower().replace(" ", "_"))
        return entities
    except Exception:
        return set()

def compute_hybrid_distance(
    embeddings: np.ndarray, 
    entities_list: List[Set[str]], 
    w_emb: float = 0.7, 
    w_ent: float = 0.3
) -> np.ndarray:
    """
    Compute hybrid distance matrix - OPTIMIZED for large datasets
    D_final = w_emb * D_cosine + w_ent * D_jaccard
    """
    n = len(embeddings)
    
    # 1. Cosine Distance
    d_emb = cosine_distances(embeddings) / 2.0
    
    # 2. Entity Jaccard Distance - OPTIMIZED
    d_ent = np.zeros((n, n))
    
    if not entities_list or not any(entities_list):
        return d_emb
    
    # Vectorized approach for better performance
    for i in range(n):
        s1 = entities_list[i]
        if not s1:
            continue
            
        for j in range(i + 1, n):
            s2 = entities_list[j]
            
            if not s2:
                dist = 1.0
            else:
                intersection = len(s1.intersection(s2))
                union = len(s1.union(s2))
                dist = 1.0 - (intersection / union) if union > 0 else 1.0
            
            d_ent[i, j] = dist
            d_ent[j, i] = dist
            
    # 3. Combine
    return w_emb * d_emb + w_ent * d_ent
