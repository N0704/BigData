'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Không thể gửi mã OTP');
            }

            setStep('otp');
            setTimer(60); // 60 seconds cooldown
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Mã OTP không chính xác');
            }

            router.push('/'); // Redirect to home
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white to-red-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">

            {/* Back to Home */}
            <Link
                href="/"
                className="absolute top-8 left-15"
            >
                <div
                    className="text-[15px] font-medium cursor-pointer shrink-0 text-gray-700"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <span className="bg-[#f04142]  text-white py-1 px-1.5 mr-0.5 rounded">
                        Tin Tức
                    </span>
                    Hôm Nay
                </div>
            </Link>

            <div className="w-full max-w-md bg-white px-10 pt-8 pb-12 rounded-xl shadow-xl relative">
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#ff2d2d] to-[#f04142]" />

                {/* Logo Section */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-semibold text-black mb-2">
                        {step === 'email' ? 'Đăng nhập' : 'Xác thực tài khoản'}
                    </h2>
                    <p className="text-[13px] text-gray-600">
                        {step === 'email' ? (
                            <>
                                Chào mừng đến với <span className="font-semibold">Tin Tức Hôm Nay</span>, đăng nhập để tiếp tục
                            </>
                        ) : (
                            <>Mã OTP đã được gửi tới {email}</>
                        )}

                    </p>
                </div>

                {step === 'email' ? (
                    <>
                        <button
                            type="button"
                            className="w-full py-2 border border-gray-300 text-sm cursor-pointer bg-white rounded-lg hover:opacity-80 mb-4"
                        >
                            <div className="flex items-center justify-center">
                                <img src="google-logo.png" alt="google" className="w-6 h-6 mr-2" />
                                <span className="text-gray-500 font-medium">
                                    Đăng nhập với Google
                                </span>
                            </div>
                        </button>

                        <div className="text-center text-xs text-gray-500 relative mb-3">
                            <span className="absolute left-0 top-1/2 w-1/3 h-px bg-gray-300"></span>
                            <span className="absolute right-0 top-1/2 w-1/3 h-px bg-gray-300"></span>
                            Hoặc đăng nhập bằng
                        </div>
                    </>
                ) : null}

                {error && (
                    <div className="bg-red-50 border-l-4 border-[#ff2d2d] p-4 mb-8 rounded-r-xl animate-in fade-in slide-in-from-left-4">
                        <div className="flex">
                            <div className="shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 font-semibold">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'email' ? (
                    <form className="space-y-6" onSubmit={handleSendOtp}>
                        <div className="space-y-2">
                            <label htmlFor="email-address" className="block mb-2 text-gray-800 font-medium text-sm">
                                Email của bạn
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#ff2d2d] transition-colors" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2d2d]/10 focus:border-[#ff2d2d] focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-6 border border-transparent text-sm font-bold rounded text-white bg-linear-to-r from-[#ff2d2d] to-[#f04142] hover:from-[#e62525] hover:to-[#d93a3b] focus:outline-none focus:ring-4 focus:ring-[#ff2d2d]/20 transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Tiếp tục
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleVerifyOtp}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label htmlFor="otp" className="block mb-2 text-gray-800 font-medium text-sm">
                                    Mã xác thực
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-xs font-medium text-[#ff2d2d] hover:text-[#cc2424] transition-colors"
                                >
                                    Đổi Email
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#ff2d2d] transition-colors" />
                                </div>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="block w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2d2d]/10 focus:border-[#ff2d2d] focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-center mt-4">
                                {timer > 0 ? (
                                    <p className="text-xs text-gray-400">
                                        Gửi lại mã sau <span className="font-bold text-gray-600">{timer}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        className="text-xs font-medium text-[#ff2d2d] hover:underline"
                                    >
                                        Gửi lại mã OTP
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-6 border border-transparent text-base font-medium rounded text-white bg-linear-to-r from-[#ff2d2d] to-[#f04142] hover:from-[#e62525] hover:to-[#d93a3b] focus:outline-none focus:ring-4 focus:ring-[#ff2d2d]/20 transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                'Xác nhận đăng nhập'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
