import feedparser
import html
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from email.utils import parsedate_to_datetime
from config import CRAWL_MAX_WORKERS, MAX_ENTRIES_PER_FEED, FETCH_FULL_CONTENT, RSS_SOURCES, CATEGORIES
from crawler_utils import parse_description, FETCHERS

def process_rss_realtime(source, rss_url, category_slug, last_seen_time):
    try:
        feed = feedparser.parse(rss_url)
        articles = []

        for item in feed.entries[:MAX_ENTRIES_PER_FEED]:
            try:
                published_at = item.get("published", "")
                if published_at:
                    try:
                        dt = parsedate_to_datetime(published_at)
                        if dt.replace(tzinfo=None) <= last_seen_time:
                            continue
                        published_at_str = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        published_at_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    published_at_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

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

                articles.append({
                    "url": item.link,
                    "title": html.unescape(item.title),
                    "content": html.unescape(content),
                    "summary": html.unescape(summary),
                    "image_url": image,
                    "source": source,
                    "published_at": published_at_str,
                    "category": {
                        "name": CATEGORIES.get(category_slug, category_slug),
                        "slug": category_slug
                    }
                })
            except Exception as e:
                continue

        return articles
    except Exception as e:
        return []

def realtime_crawl(last_seen_time):
    all_articles = []

    with ThreadPoolExecutor(max_workers=CRAWL_MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_rss_realtime, src, url, cat, last_seen_time)
            for src, url, cat in RSS_SOURCES
        ]

        for f in as_completed(futures):
            try:
                articles = f.result()
                all_articles.extend(articles)
            except Exception as e:
                pass

    if all_articles:
        print(f"  Found {len(all_articles)} new articles")
    
    return all_articles

