import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { email, otp } = await request.json();

        // Verify OTP
        const otpRecord = db.prepare('SELECT * FROM otps WHERE email = ?').get(email);

        if (!otpRecord) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (new Date(otpRecord.expires_at) < new Date()) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        // Check if user exists, if not create
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            // Generate default name: u + 8 random digits
            const randomId = Math.floor(10000000 + Math.random() * 90000000);
            const defaultName = `u${randomId}`;
            const defaultAvatar = 'https://res.cloudinary.com/dxk5awt0e/image/upload/v1765006791/neura/media/fymfft2fxgervxejiuay.jpg';

            const info = db.prepare('INSERT INTO users (email, name, avatar, provider) VALUES (?, ?, ?, ?)').run(email, defaultName, defaultAvatar, 'email');
            user = { id: info.lastInsertRowid, email, name: defaultName, avatar: defaultAvatar };
        }

        // Create session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, expiresAt);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        // Delete used OTP
        db.prepare('DELETE FROM otps WHERE email = ?').run(email);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
