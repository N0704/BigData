import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
        // Delete session from DB
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }

    // Delete cookie
    cookieStore.delete('session_id');

    return NextResponse.json({ success: true });
}
