import feedparser
import json
import time
import html as html_utils
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from config import RSS_SOURCES, CATEGORIES
from crawler_utils import parse_description, FETCHERS

# ==================================================
# CONFIG
# ==================================================
# ==================================================
# CONFIG
# ==================================================
TIMEOUT = 10
MAX_ARTICLES_PER_RSS = None
RSS_WORKERS = 10        # Workers for fetching RSS feeds
ARTICLE_WORKERS = 20    # Workers for fetching article content (I/O bound)

# ==================================================
# COMMON UTILS
# ==================================================
def parse_published(item):
    if hasattr(item, "published_parsed") and item.published_parsed:
        return datetime(*item.published_parsed[:6]).isoformat()
    return None

# ==================================================
# STAGE 1: FETCH RSS ITEMS
# ==================================================
def fetch_rss_items(source, rss_url, category):
    """Fetch items from RSS feed without downloading content yet"""
    print(f"📡 Fetching RSS: {source} | {category}")
    try:
        feed = feedparser.parse(rss_url)
        items = []
        
        entries = feed.entries if MAX_ARTICLES_PER_RSS is None else feed.entries[:MAX_ARTICLES_PER_RSS]
        
        for item in entries:
            summary, image_desc = parse_description(item.get("description", ""))
            
            image = image_desc
            if hasattr(item, "enclosures") and item.enclosures:
                image = item.enclosures[0].get("url") or image
                
            items.append({
                "source": source,
                "category_id": category,
                "category_name": CATEGORIES.get(category),
                "title": html_utils.unescape(item.title),
                "summary": html_utils.unescape(summary),
                "image": image,
                "link": item.link,
                "published_at": parse_published(item),
                "crawled_at": datetime.utcnow().isoformat(),
                # Content will be fetched later
                "content": "" 
            })
        return items
    except Exception as e:
        print(f"❌ Error fetching RSS {rss_url}: {e}")
        return []

# ==================================================
# STAGE 2: FETCH ARTICLE CONTENT
# ==================================================
def fetch_article_content(article):
    """Fetch content for a single article"""
    try:
        fetcher = FETCHERS.get(article["source"])
        if fetcher:
            content = fetcher(article["link"])
            article["content"] = html_utils.unescape(content) if content else ""
        return article
    except Exception as e:
        print(f"⚠️ Error fetching content for {article['link']}: {e}")
        return article

# ==================================================
# MAIN
# ==================================================
def main():
    start_time = time.time()
    all_items = []
    
    # --- STAGE 1: Fetch RSS Feeds ---
    print(f"\n🚀 STAGE 1: Fetching {len(RSS_SOURCES)} RSS feeds...")
    with ThreadPoolExecutor(max_workers=RSS_WORKERS) as executor:
        futures = [
            executor.submit(fetch_rss_items, src, url, cat)
            for src, url, cat in RSS_SOURCES
        ]
        
        for f in as_completed(futures):
            items = f.result()
            if items:
                all_items.extend(items)
                
    print(f"✓ Found {len(all_items)} potential articles from RSS")
    
    # --- STAGE 2: Fetch Content ---
    print(f"\n🚀 STAGE 2: Fetching content for {len(all_items)} articles with {ARTICLE_WORKERS} workers...")
    
    final_articles = []
    seen_links = set()
    
    with ThreadPoolExecutor(max_workers=ARTICLE_WORKERS) as executor:
        # Submit all content fetch tasks
        future_to_article = {
            executor.submit(fetch_article_content, item): item 
            for item in all_items
        }
        
        completed = 0
        total = len(all_items)
        
        for future in as_completed(future_to_article):
            article = future.result()
            
            # Deduplicate based on link
            if article["link"] not in seen_links:
                seen_links.add(article["link"])
                # Only keep articles with content (optional, but good for quality)
                if article["content"] and len(article["content"]) > 100:
                    final_articles.append(article)
            
            completed += 1
            if completed % 10 == 0:
                print(f"  Progress: {completed}/{total}...", end="\r")

    elapsed = time.time() - start_time
    print(f"\n\n✅ DONE! Crawled {len(final_articles)} valid articles in {elapsed:.2f}s")
    
    filename = f"news_{int(time.time())}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(final_articles, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
