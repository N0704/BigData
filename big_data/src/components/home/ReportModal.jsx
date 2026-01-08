'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ChevronRight } from 'lucide-react';

const ReportModal = ({ newsId, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const getFingerprint = () => {
        let fp = localStorage.getItem('visitor_fp');
        if (!fp) {
            fp = 'fp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('visitor_fp', fp);
        }
        return fp;
    };

    const saveToLocalHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('reported_news') || '[]');
        if (!history.includes(id)) {
            history.push(id);
            localStorage.setItem('reported_news', JSON.stringify(history));
        }
    };

    const reasons = [
        { id: 'under_18', label: 'Vấn đề liên quan đến người dưới 18 tuổi' },
        { id: 'harassment', label: 'Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi' },
        { id: 'violence', label: 'Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái' },
        { id: 'restricted_goods', label: 'Bán hoặc quảng cáo mặt hàng bị hạn chế' },
        { id: 'adult_content', label: 'Nội dung người lớn' },
        { id: 'false_info', label: 'Thông tin sai sự thật, lừa đảo hoặc gian lận' },
        { id: 'intellectual_property', label: 'Quyền sở hữu trí tuệ' },
        { id: 'not_interested', label: 'Chỉ là tôi không thích nội dung này' },
    ];

    const handleReport = async (reasonId) => {
        setIsSubmitting(true);
        try {
            const fingerprint = getFingerprint();
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newsId,
                    reason: reasonId,
                    description: '',
                    fingerprint
                }),
            });

            if (response.ok) {
                setIsSuccess(true);
                saveToLocalHistory(newsId);
                setTimeout(() => {
                    onClose(true);
                }, 2000);
            }
        } catch (err) {
            console.error('Report error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-[550px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-4 py-3.5 border-b border-gray-200 flex items-center justify-center">
                    <h3 className="text-xl font-bold text-gray-900">Báo cáo</h3>
                    <button
                        onClick={() => onClose(false)}
                        className="absolute right-4 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-12 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Cảm ơn bạn!</h4>
                        <p className="text-gray-600 text-lg">Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét nội dung này sớm nhất có thể.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="p-4 border-b border-gray-50">
                            <h4 className="text-base font-bold text-gray-900">Tại sao bạn báo cáo bài viết này?</h4>
                        </div>

                        <div className="max-h-[70vh]">
                            {reasons.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleReport(r.id)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group disabled:opacity-50"
                                >
                                    <span className="text-[15px] font-semibold text-gray-800 group-hover:text-gray-900 text-left">
                                        {r.label}
                                    </span>
                                    <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ReportModal;
