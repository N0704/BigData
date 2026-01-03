import { NextResponse } from 'next/server';
import { searchNews } from '@/lib/actions/news';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('keyword');
        const categoryId = searchParams.get('categoryId');

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ results: [] });
        }

        const results = await searchNews(
            query.trim(),
            categoryId ? parseInt(categoryId) : null,
            20
        );

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi tìm kiếm' },
            { status: 500 }
        );
    }
}
