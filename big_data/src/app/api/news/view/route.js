import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateClusterHotScore } from '@/lib/actions/news';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { url, newsId } = await request.json();

        if (!url && !newsId) {
            return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        let userId = null;
        if (sessionId) {
            const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
            if (session) {
                userId = session.user_id;
            }
        }

        // Tìm bài viết dựa trên URL hoặc ID
        let news;
        if (url) {
            news = db.prepare('SELECT id, cluster_id FROM news WHERE url = ?').get(url);
        } else {
            news = db.prepare('SELECT id, cluster_id FROM news WHERE id = ?').get(newsId);
        }

        if (!news) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        // Thực hiện trong transaction
        const transaction = db.transaction(() => {
            // 1. Tăng view_count tổng trong bảng news
            db.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').run(news.id);

            // 2. Chỉ ghi log vào read_logs nếu là thành viên đã đăng nhập
            if (userId) {
                db.prepare('INSERT INTO read_logs (user_id, news_id, url) VALUES (?, ?, ?)').run(userId, news.id, url || news.url);
            }

            // 3. Cập nhật hot_score cho cluster
            if (news.cluster_id) {
                updateClusterHotScore(news.cluster_id);
            }
        });

        transaction();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }
}
