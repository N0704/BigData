# News Crawler & Clustering System

Hệ thống crawl tin tức, phân cụm tự động, tính hot score và lưu vào database.

## Chức năng

Hệ thống Python này chỉ làm nhiệm vụ:
- ✅ Crawl tin tức từ RSS feeds liên tục
- ✅ Embed và phân cụm tự động (DBSCAN/HDBSCAN)
- ✅ Tính hot score cho các cụm
- ✅ Lưu dữ liệu vào database SQLite

Phần hiển thị sẽ được làm bằng Next.js riêng biệt.

## Cài đặt

```bash
pip install -r requirements.txt
```

## Chạy hệ thống

### Crawler (chạy liên tục)

```bash
python main.py
```

Hệ thống sẽ:
- Crawl tin tức từ RSS feeds
- Embed và phân cụm tự động
- Tính hot score
- Lưu vào database
- Tự động recluster định kỳ để tối ưu

### Recluster (tùy chọn)

```bash
# Recluster tất cả categories
python recluster.py

# Recluster một category cụ thể
python recluster.py cong-nghe
```

## Cấu hình

Chỉnh sửa `config.py` để thay đổi:
- `SIM_THRESHOLD`: Ngưỡng similarity cho clustering (0.85)
- `MIN_SAMPLES`: Số tin tối thiểu trong cluster (2)
- `EPS`: Ngưỡng khoảng cách cho DBSCAN (0.3)
- `BATCH_CLUSTERING_THRESHOLD`: Ngưỡng để dùng batch clustering (10)
- `USE_HDBSCAN`: Bật HDBSCAN nếu có (False)
- `K_NEIGHBORS`: Số neighbors cho k-NN (5)
- `HOT_DECAY_HOURS`: Thời gian decay cho hot score (6 giờ)
- `BATCH_INTERVAL`: Khoảng thời gian crawl (300s = 5 phút)
- `RECLUSTER_INTERVAL`: Khoảng thời gian recluster (3600s = 1 giờ)

## Database

Database SQLite: `news.db`

### Tables:

- **categories**: Danh mục tin
  - `id`, `name`, `slug`

- **clusters**: Các cụm tin (có hot_score)
  - `id`, `category_id`, `centroid` (BLOB), `size`, `hot_score`, `created_at`, `last_update`

- **news**: Tin tức
  - `id`, `title`, `content`, `summary`, `image_url`, `source`, `published_at`, `category_id`, `cluster_id`, `embedding` (BLOB), `created_at`

## Query dữ liệu từ Next.js

Bạn có thể query trực tiếp từ SQLite database:

```sql
-- Lấy tin hot nhất
SELECT n.*, c.hot_score, c.size as cluster_size
FROM news n
INNER JOIN clusters c ON n.cluster_id = c.id
WHERE c.hot_score >= 0.1
ORDER BY c.hot_score DESC, n.published_at DESC
LIMIT 20;

-- Lấy tin theo category
SELECT n.*, c.hot_score, c.size as cluster_size
FROM news n
INNER JOIN clusters c ON n.cluster_id = c.id
INNER JOIN categories cat ON n.category_id = cat.id
WHERE cat.slug = 'cong-nghe'
ORDER BY c.hot_score DESC, n.published_at DESC
LIMIT 20;

-- Lấy top clusters
SELECT c.*, cat.name as category_name, cat.slug as category_slug
FROM clusters c
INNER JOIN categories cat ON c.category_id = cat.id
ORDER BY c.hot_score DESC
LIMIT 10;
```

