import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

interface PWAInstallButtonProps {
  accentHex?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ accentHex = '#00f2fe' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-950 transition cursor-pointer hover:brightness-110 active:scale-95 shadow-md"
        style={{
          backgroundColor: accentHex,
          boxShadow: `0 0 14px ${accentHex}80`,
        }}
        title="تثبيت SoundPulse Pro كتطبيق أندرويد مستقل يعمل بدون إنترنت"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/15 border border-white/20 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">تثبيت iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  تثبيت المشغل على الهاتف
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري.<br />
                2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-2xl bg-cyan-400 text-black font-bold text-xs"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
