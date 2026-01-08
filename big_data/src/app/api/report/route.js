import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { updateClusterHotScore } from '@/lib/actions/news';

export async function POST(request) {
    try {
        const { newsId, reason, description, fingerprint } = await request.json();

        if (!newsId || !reason) {
            return NextResponse.json({ error: 'Thiếu thông tin bài viết hoặc lý do báo cáo' }, { status: 400 });
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

        // Kiểm tra xem user đã report bài này chưa
        if (userId) {
            const existing = db.prepare('SELECT id FROM reports WHERE news_id = ? AND user_id = ?').get(newsId, userId);
            if (existing) {
                return NextResponse.json({ error: 'Bạn đã báo cáo bài viết này rồi' }, { status: 400 });
            }
        } else if (fingerprint) {
            const existing = db.prepare('SELECT id FROM reports WHERE news_id = ? AND fingerprint = ? AND user_id IS NULL').get(newsId, fingerprint);
            if (existing) {
                return NextResponse.json({ error: 'Bạn đã báo cáo bài viết này rồi' }, { status: 400 });
            }
        }

        // Thực hiện transaction
        const transaction = db.transaction(() => {
            // 1. Insert report
            db.prepare('INSERT INTO reports (news_id, user_id, fingerprint, reason, description) VALUES (?, ?, ?, ?, ?)').run(
                newsId,
                userId,
                fingerprint || null,
                reason,
                description || null
            );

            // 2. Update news.report_count
            db.prepare('UPDATE news SET report_count = report_count + 1 WHERE id = ?').run(newsId);

            // Lấy cluster_id
            const news = db.prepare('SELECT cluster_id FROM news WHERE id = ?').get(newsId);

            if (news && news.cluster_id) {
                // 3. Tự động cập nhật hot_score cho cluster
                updateClusterHotScore(news.cluster_id);
            }
        });

        transaction();

        return NextResponse.json({ success: true, message: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.' });
    } catch (error) {
        console.error('Error reporting news:', error);
        return NextResponse.json({ error: 'Gửi báo cáo thất bại. Vui lòng thử lại sau.' }, { status: 500 });
    }
}
