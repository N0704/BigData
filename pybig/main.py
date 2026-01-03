import time
from datetime import datetime
from db import init_db, cursor, conn, vec_to_blob
from embedder import embed
import numpy as np
from clustering import hybrid_cluster_articles, recluster_category
from hot_score import update_hot_scores
from rss_bootstrap import bootstrap_crawl
from realtime_stream import realtime_crawl
from config import BATCH_INTERVAL, RECLUSTER_INTERVAL, EMBED_BATCH_SIZE

def get_or_create_category(cat):
    cursor.execute(
        "SELECT id FROM categories WHERE slug = ?",
        (cat["slug"],)
    )
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(
        "INSERT INTO categories (name, slug) VALUES (?, ?)",
        (cat["name"], cat["slug"])
    )
    conn.commit()
    return cursor.lastrowid

def check_existing_urls(urls):
    if not urls:
        return set()
    
    placeholders = ','.join('?' * len(urls))
    cursor.execute(
        f"SELECT url FROM news WHERE url IN ({placeholders})",
        urls
    )
    return {row[0] for row in cursor.fetchall()}

def process_articles(articles):
    if not articles:
        return

    existing_urls = check_existing_urls([art.get("url", "") for art in articles if art.get("url")])
    
    if existing_urls:
        print(f"Skipped {len(existing_urls)} duplicates")
    
    articles = [art for art in articles if art.get("url", "") not in existing_urls]
    
    if not articles:
        print("All articles already in database")
        return
    
    print(f"Processing {len(articles)} articles...")

    articles_by_category = {}
    for art in articles:
        try:
            category_id = get_or_create_category(art["category"])
            if category_id not in articles_by_category:
                articles_by_category[category_id] = []
            articles_by_category[category_id].append(art)
        except Exception as e:
            print(f"\nError processing category: {e}")

    for category_id, cat_articles in articles_by_category.items():
        print(f"  Processing {len(cat_articles)} articles in category {category_id}...")
        
        print(f"  Embedding {len(cat_articles)} articles in batches...")
        texts_to_embed = [
            art["title"] + " " + art["content"][:2000]
            for art in cat_articles
        ]
        
        try:
            embeddings = embed(texts_to_embed, batch_size=EMBED_BATCH_SIZE)
        except Exception as e:
            print(f"  ✗ Batch embedding error: {e}, falling back to individual embedding...")
            embeddings = []
            for art in cat_articles:
                try:
                    vec = embed(art["title"] + " " + art["content"][:2000])
                    embeddings.append(vec)
                except:
                    embeddings.append(None)
        
        print(f"  Inserting {len(cat_articles)} articles into database...")
        article_data = []
        
        insert_data = []
        for i, art in enumerate(cat_articles):
            if embeddings[i] is not None:
                insert_data.append((
                    art.get("url", ""),
                    art["title"],
                    art["content"],
                    art["summary"],
                    art["image_url"],
                    art["source"],
                    art["published_at"],
                    category_id,
                    vec_to_blob(embeddings[i])
                ))
        
        if insert_data:
            for i, (art, data_tuple) in enumerate(zip(cat_articles, insert_data)):
                if embeddings[i] is not None:
                    try:
                        cursor.execute("""
                            INSERT OR IGNORE INTO news (
                                url,
                                title,
                                content,
                                summary,
                                image_url,
                                source,
                                published_at,
                                category_id,
                                embedding
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, data_tuple)
                        
                        news_id = cursor.lastrowid
                        if news_id:
                            article_data.append({
                                "id": news_id,
                                "embedding": embeddings[i]
                            })
                    except Exception as e:
                        cursor.execute("SELECT id FROM news WHERE title = ? AND category_id = ?", 
                                     (art["title"], category_id))
                        row = cursor.fetchone()
                        if row:
                            article_data.append({
                                "id": row[0],
                                "embedding": embeddings[i]
                            })
            
            conn.commit()
        
        if not article_data:
            print(f"  No new articles to cluster in category {category_id}")
            continue
        
        print(f"  ⚡ Clustering {len(article_data)} articles with optimized algorithm...")
        clustering_start = time.time()
        try:
            hybrid_cluster_articles(article_data, category_id)
            clustering_time = time.time() - clustering_start
            print(f"  ✓ Clustered {len(article_data)} articles in {clustering_time:.2f}s")
            print(f"    ({len(article_data)/clustering_time:.1f} articles/sec)")
        except Exception as e:
            print(f"  ✗ Error clustering: {e}")
            print(f"  Falling back to incremental clustering...")
            try:
                hybrid_cluster_articles(article_data, category_id, use_enhanced=False)
                clustering_time = time.time() - clustering_start
                print(f"  ✓ Clustered {len(article_data)} articles using fallback in {clustering_time:.2f}s")
            except Exception as e2:
                print(f"  ✗ Error in fallback clustering: {e2}")

    print(f"\n✓ Processed {len(articles)} articles successfully\n")

def main():   
    print("Initializing database...")
    init_db()

    bootstrap_articles = bootstrap_crawl()
    process_articles(bootstrap_articles)

    last_seen_time = datetime.utcnow()

    print(f"\n[REALTIME] Checking every {BATCH_INTERVAL}s\n")
    print(f"[RECLUSTER] Will recluster every {RECLUSTER_INTERVAL}s\n")
    
    cycle = 0
    last_recluster_time = time.time()
    
    while True:
        try:
            cycle += 1
            current_time = time.strftime('%H:%M:%S')
            current_timestamp = time.time()
            
            print(f"[{current_time}] Cycle #{cycle} - Checking RSS feeds...")
            new_articles = realtime_crawl(last_seen_time)

            if new_articles:
                process_articles(new_articles)
                last_seen_time = datetime.utcnow()

            print(f"[{current_time}] Updating hot scores...")
            update_hot_scores()
            
            if current_timestamp - last_recluster_time >= RECLUSTER_INTERVAL:
                print(f"[{current_time}] ⚡ Starting periodic reclustering with optimized algorithm...")
                recluster_start = time.time()
                try:
                    cursor.execute("SELECT id FROM categories")
                    categories = cursor.fetchall()
                    
                    total_clusters = 0
                    total_articles = 0
                    
                    for (category_id,) in categories:
                        print(f"  Reclustering category {category_id}...")
                        stats = recluster_category(category_id)
                        total_clusters += stats.get('clusters_created', 0)
                        total_articles += stats.get('articles', 0)
                        print(f"  ✓ Created {stats.get('clusters_created', 0)} clusters for {stats.get('articles', 0)} articles")
                    
                    recluster_time = time.time() - recluster_start
                    print(f"[{current_time}] ✓ Reclustering completed in {recluster_time:.2f}s")
                    print(f"  Total: {total_clusters} clusters, {total_articles} articles")
                    if total_articles > 0:
                        print(f"  Performance: {total_articles/recluster_time:.1f} articles/sec")
                    last_recluster_time = current_timestamp
                except Exception as e:
                    print(f"[{current_time}] ✗ Reclustering error: {e}")

            print(f"[{current_time}] Sleeping {BATCH_INTERVAL}s...\n")
            time.sleep(BATCH_INTERVAL)

        except KeyboardInterrupt:
            print(f"\nStopped by user\n")
            break
        except Exception as e:
            print(f"\nError: {e}")
            print(f"Retrying in 60s...")
            time.sleep(60)

if __name__ == "__main__":
    main()
