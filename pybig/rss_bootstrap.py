import feedparser
import html
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from config import CRAWL_MAX_WORKERS, MAX_ENTRIES_PER_FEED, FETCH_FULL_CONTENT, RSS_SOURCES, CATEGORIES
from crawler_utils import parse_description, FETCHERS

def process_rss(source, rss_url, category_slug):
    print(f"  Crawling {source} | {category_slug}")
    try:
        feed = feedparser.parse(rss_url)
        articles = []

        for item in feed.entries[:MAX_ENTRIES_PER_FEED]:
            try:
                summary, image_desc = parse_description(item.get("description", ""))

                image = image_desc
                if hasattr(item, "enclosures") and item.enclosures:
                    image = item.enclosures[0].get("url") or image

                content = ""
                if FETCH_FULL_CONTENT:
                    fetcher = FETCHERS.get(source)
                    if fetcher:
                        content = fetcher(item.link)

                if not content:
                    content = summary

                published_at = item.get("published", "")
                if published_at:
                    try:
                        from email.utils import parsedate_to_datetime
                        dt = parsedate_to_datetime(published_at)
                        published_at = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        published_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    published_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

                articles.append({
                    "url": item.link,
                    "title": html.unescape(item.title),
                    "content": html.unescape(content),
                    "summary": html.unescape(summary),
                    "image_url": image,
                    "source": source,
                    "published_at": published_at,
                    "category": {
                        "name": CATEGORIES.get(category_slug, category_slug),
                        "slug": category_slug
                    }
                })
            except Exception as e:
                continue

        return articles
    except Exception as e:
        print(f"  Error processing RSS {source}/{category_slug}: {e}")
        return []

def bootstrap_crawl():
    print("\n=== BOOTSTRAP CRAWL ===\n")
    all_articles = []

    with ThreadPoolExecutor(max_workers=CRAWL_MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_rss, src, url, cat)
            for src, url, cat in RSS_SOURCES
        ]

        for f in as_completed(futures):
            try:
                articles = f.result()
                all_articles.extend(articles)
            except Exception as e:
                print(f"  Error in future: {e}")

    print(f"\n✓ Bootstrap crawled {len(all_articles)} articles\n")
    return all_articles


