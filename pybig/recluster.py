import sys
from db import init_db, cursor
from clustering import recluster_category
from hot_score import update_hot_scores

def recluster_all():
    print("Initializing database...")
    init_db()
    
    print("\n=== RECLUSTERING ALL CATEGORIES ===\n")
    
    cursor.execute("SELECT id, name, slug FROM categories")
    categories = cursor.fetchall()
    
    if not categories:
        print("No categories found!")
        return
    
    total_clusters = 0
    total_articles = 0
    
    for category_id, category_name, category_slug in categories:
        print(f"Reclustering category: {category_name} (ID: {category_id})...")
        try:
            stats = recluster_category(category_id)
            clusters_created = stats.get('clusters_created', 0)
            articles_reclustered = stats.get('articles', 0)
            
            total_clusters += clusters_created
            total_articles += articles_reclustered
            
            print(f"  ✓ Created {clusters_created} clusters for {articles_reclustered} articles\n")
        except Exception as e:
            print(f"  ✗ Error: {e}\n")
    
    print("Updating hot scores...")
    update_hot_scores()
    
    print(f"\n=== COMPLETED ===")
    print(f"Total clusters created: {total_clusters}")
    print(f"Total articles reclustered: {total_articles}")

def recluster_category_by_slug(category_slug: str):
    print("Initializing database...")
    init_db()
    
    cursor.execute("SELECT id, name FROM categories WHERE slug = ?", (category_slug,))
    row = cursor.fetchone()
    
    if not row:
        print(f"Category '{category_slug}' not found!")
        return
    
    category_id, category_name = row
    
    print(f"\n=== RECLUSTERING CATEGORY: {category_name} ===\n")
    
    try:
        stats = recluster_category(category_id)
        print(f"✓ Created {stats.get('clusters_created', 0)} clusters for {stats.get('articles', 0)} articles")
        
        print("\nUpdating hot scores...")
        update_hot_scores()
        print("✓ Done!")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        category_slug = sys.argv[1]
        recluster_category_by_slug(category_slug)
    else:
        recluster_all()
