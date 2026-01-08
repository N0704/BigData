import { NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

        // Save to DB
        const stmt = db.prepare(`
      INSERT INTO otps (email, otp, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
      otp = excluded.otp,
      expires_at = excluded.expires_at,
      created_at = CURRENT_TIMESTAMP
    `);
        stmt.run(email, otp, expiresAt);

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã xác thực đăng nhập - Tin Tức Hôm Nay',
            text: `Xin chào,

Chúng tôi nhận được yêu cầu đăng nhập vào hệ thống Tin Tức Hôm Nay bằng địa chỉ email này.

Mã xác thực của bạn là:

${otp}

Mã xác thực có hiệu lực trong vòng 5 phút kể từ thời điểm gửi email.
Vui lòng nhập mã này để hoàn tất quá trình đăng nhập.

Vì lý do bảo mật, xin không chia sẻ mã xác thực này cho bất kỳ ai.
Nếu bạn không thực hiện yêu cầu đăng nhập, vui lòng bỏ qua email này.

Trân trọng,
Tin Tức Hôm Nay
Nền tảng tổng hợp tin tức thông minh, cập nhật liên tục 24/7 từ các nguồn báo chí uy tín hàng đầu Việt Nam.`,
            html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <p>Xin chào,</p>
    <p>Chúng tôi nhận được yêu cầu đăng nhập vào hệ thống <strong>Tin Tức Hôm Nay</strong> bằng địa chỉ email này.</p>
    <p>Mã xác thực của bạn là:</p>
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #d9534f;">${otp}</span>
    </div>
    <p>Mã xác thực có hiệu lực trong vòng 5 phút kể từ thời điểm gửi email.<br>
    Vui lòng nhập mã này để hoàn tất quá trình đăng nhập.</p>
    <p style="color: #666; font-size: 14px; border-left: 3px solid #d9534f; padding-left: 10px; margin: 20px 0;">
        Vì lý do bảo mật, xin không chia sẻ mã xác thực này cho bất kỳ ai.<br>
        Nếu bạn không thực hiện yêu cầu đăng nhập, vui lòng bỏ qua email này.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p>Trân trọng,<br>
    <strong>Tin Tức Hôm Nay</strong><br>
    <span style="font-size: 13px; color: #888;">Nền tảng tổng hợp tin tức thông minh, cập nhật liên tục 24/7 từ các nguồn báo chí uy tín hàng đầu Việt Nam.</span></p>
</div>`
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
