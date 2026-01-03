import requests
from bs4 import BeautifulSoup
from config import HEADERS, CRAWL_TIMEOUT

# Use a session for connection pooling
session = requests.Session()
session.headers.update(HEADERS)

def parse_description(html):
    # Use lxml for faster parsing if available, fallback to html.parser
    try:
        soup = BeautifulSoup(html, "lxml")
    except:
        soup = BeautifulSoup(html, "html.parser")
        
    img = soup.find("img")
    image = img["src"] if img else None
    summary = soup.get_text(" ", strip=True)
    return summary, image

def fetch_html(url):
    try:
        # Use session instead of requests.get
        r = session.get(url, timeout=CRAWL_TIMEOUT)
        r.encoding = 'utf-8'
        
        try:
            return BeautifulSoup(r.text, "lxml")
        except:
            return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_p_text(article):
    if not article:
        return ""

    for fig in article.find_all("figure"):
        fig.decompose()

    content = []
    for p in article.find_all("p"):
        text = p.get_text(" ", strip=True)
        if not text:
            continue
        content.append(text)

    return "\n".join(content)

def fetch_vnexpress(url):
    soup = fetch_html(url)
    if not soup: return ""
    article = soup.find("article", class_="fck_detail")
    return extract_p_text(article)

def fetch_tuoitre(url):
    soup = fetch_html(url)
    if not soup: return ""
    article = soup.find("div", class_="detail-content")
    return extract_p_text(article)

def fetch_dantri(url):
    soup = fetch_html(url)
    if not soup: return ""
    article = soup.find("div", class_="singular-content")
    return extract_p_text(article)

def fetch_thanhnien(url):
    soup = fetch_html(url)
    if not soup: return ""
    article = soup.find("article") or soup.find("div", class_="content-detail")
    return extract_p_text(article)

def fetch_vietnamnet(url):
    soup = fetch_html(url)
    if not soup: return ""
    article = (
        soup.find("div", class_="maincontent")
        or soup.find("div", class_="content-detail")
        or soup.find("article")
    )

    content = extract_p_text(article)
    return "\n".join(
        line for line in content.split("\n")
        if "vietnamnet" not in line.lower()
    )

FETCHERS = {
    "VNExpress": fetch_vnexpress,
    "Tuổi Trẻ": fetch_tuoitre,
    "Dân Trí": fetch_dantri,
    "Thanh Niên": fetch_thanhnien,
    "VietnamNet": fetch_vietnamnet,
}
