import { cookies } from 'next/headers';
import db from './db';

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
        return null;
    }

    const session = db.prepare(`
    SELECT sessions.*, users.email, users.name, users.avatar, users.provider 
    FROM sessions 
    JOIN users ON sessions.user_id = users.id 
    WHERE sessions.id = ? AND sessions.expires_at > CURRENT_TIMESTAMP
  `).get(sessionId);

    if (!session) {
        return null;
    }

    return {
        id: session.user_id,
        email: session.email,
        name: session.name,
        avatar: session.avatar,
        provider: session.provider,
    };
}
