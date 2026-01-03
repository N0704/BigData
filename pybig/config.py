DB_PATH = "news.db"

# =========================
# EMBEDDING & SIMILARITY
# =========================
SIM_THRESHOLD = 0.90
EMBED_BATCH_SIZE = 32

# =========================
# CLUSTERING
# =========================
USE_HDBSCAN = True
MIN_SAMPLES = 5
EPS = 0.10
K_NEIGHBORS = 7

BATCH_CLUSTERING_THRESHOLD = 8

MERGE_SIMILARITY_THRESHOLD = 0.88
CLUSTER_QUALITY_THRESHOLD = 0.30
MIN_CLUSTER_VARIANCE = 0.02
DYNAMIC_EPS_ENABLED = True

DRIFT_DETECTION_WINDOW = 30

# =========================
# HOT SCORE
# =========================
HOT_DECAY_HOURS = 12

# =========================
# SCHEDULER
# =========================
BATCH_INTERVAL = 600
RECLUSTER_INTERVAL = 7200

# =========================
# CRAWLER
# =========================
CRAWL_MAX_WORKERS = 10
CRAWL_TIMEOUT = 15
CRAWL_RETRY_ATTEMPTS = 2

FETCH_FULL_CONTENT = True
MAX_ENTRIES_PER_FEED = None

# ==================================================
# CRAWLER CONFIG
# ==================================================
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

CATEGORIES = {
    "thoi-su": "Thời sự",
    "the-gioi": "Thế giới",
    "kinh-doanh": "Kinh doanh",
    "giai-tri": "Giải trí",
    "the-thao": "Thể thao",
    "phap-luat": "Pháp luật",
    "giao-duc": "Giáo dục",
    "suc-khoe": "Sức khỏe",
}

RSS_SOURCES = [
    ("VNExpress", "https://vnexpress.net/rss/thoi-su.rss", "thoi-su"),
    ("VNExpress", "https://vnexpress.net/rss/the-gioi.rss", "the-gioi"),
    ("VNExpress", "https://vnexpress.net/rss/kinh-doanh.rss", "kinh-doanh"),
    ("VNExpress", "https://vnexpress.net/rss/giai-tri.rss", "giai-tri"),
    ("VNExpress", "https://vnexpress.net/rss/the-thao.rss", "the-thao"),
    ("VNExpress", "https://vnexpress.net/rss/phap-luat.rss", "phap-luat"),
    ("VNExpress", "https://vnexpress.net/rss/giao-duc.rss", "giao-duc"),
    ("VNExpress", "https://vnexpress.net/rss/suc-khoe.rss", "suc-khoe"),

    ("Tuổi Trẻ", "https://tuoitre.vn/rss/thoi-su.rss", "thoi-su"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/the-gioi.rss", "the-gioi"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/kinh-doanh.rss", "kinh-doanh"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/giai-tri.rss", "giai-tri"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/the-thao.rss", "the-thao"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/phap-luat.rss", "phap-luat"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/giao-duc.rss", "giao-duc"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/suc-khoe.rss", "suc-khoe"),

    ("Dân Trí", "https://dantri.com.vn/rss/thoi-su.rss", "thoi-su"),
    ("Dân Trí", "https://dantri.com.vn/rss/the-gioi.rss", "the-gioi"),
    ("Dân Trí", "https://dantri.com.vn/rss/kinh-doanh.rss", "kinh-doanh"),
    ("Dân Trí", "https://dantri.com.vn/rss/giai-tri.rss", "giai-tri"),
    ("Dân Trí", "https://dantri.com.vn/rss/the-thao.rss", "the-thao"),
    ("Dân Trí", "https://dantri.com.vn/rss/phap-luat.rss", "phap-luat"),
    ("Dân Trí", "https://dantri.com.vn/rss/giao-duc.rss", "giao-duc"),
    ("Dân Trí", "https://dantri.com.vn/rss/suc-khoe.rss", "suc-khoe"),

    ("Thanh Niên", "https://thanhnien.vn/rss/thoi-su.rss", "thoi-su"),
    ("Thanh Niên", "https://thanhnien.vn/rss/the-gioi.rss", "the-gioi"),
    ("Thanh Niên", "https://thanhnien.vn/rss/kinh-doanh.rss", "kinh-doanh"),
    ("Thanh Niên", "https://thanhnien.vn/rss/giai-tri.rss", "giai-tri"),
    ("Thanh Niên", "https://thanhnien.vn/rss/the-thao.rss", "the-thao"),
    ("Thanh Niên", "https://thanhnien.vn/rss/phap-luat.rss", "phap-luat"),
    ("Thanh Niên", "https://thanhnien.vn/rss/giao-duc.rss", "giao-duc"),
    ("Thanh Niên", "https://thanhnien.vn/rss/suc-khoe.rss", "suc-khoe"),

    ("VietnamNet", "https://vietnamnet.vn/rss/thoi-su.rss", "thoi-su"),
    ("VietnamNet", "https://vietnamnet.vn/rss/the-gioi.rss", "the-gioi"),
    ("VietnamNet", "https://vietnamnet.vn/rss/kinh-doanh.rss", "kinh-doanh"),
    ("VietnamNet", "https://vietnamnet.vn/rss/giai-tri.rss", "giai-tri"),
    ("VietnamNet", "https://vietnamnet.vn/rss/the-thao.rss", "the-thao"),
    ("VietnamNet", "https://vietnamnet.vn/rss/phap-luat.rss", "phap-luat"),
    ("VietnamNet", "https://vietnamnet.vn/rss/giao-duc.rss", "giao-duc"),
    ("VietnamNet", "https://vietnamnet.vn/rss/suc-khoe.rss", "suc-khoe"),
]