import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Target, Sparkles, ClipboardList, CheckCircle } from 'lucide-react';
import FeatureCard, { ColorTheme } from '@/components/FeatureCard';

export default function HomePage() {
    const features = [
        {
            href: "/generator?mode=rpp",
            title: "RPP Ringkas",
            description: "Buat Rencana Pelaksanaan Pembelajaran harian yang padat dan terstruktur.",
            icon: FileText,
            colorTheme: "emerald" as ColorTheme
        },
        {
            href: "/generator?mode=modul",
            title: "Modul Ajar",
            description: "Buat Modul Ajar komprehensif lengkap dengan materi pendukung dan LKPD.",
            icon: BookOpen,
            colorTheme: "teal" as ColorTheme
        },
        {
            href: "/generator?mode=soal",
            title: "Soal Evaluasi",
            description: "Buat paket soal HOTS pilihan ganda dan esai beserta kunci jawabannya.",
            icon: Target,
            colorTheme: "indigo" as ColorTheme
        },
        {
            href: "/jurnal",
            title: "Jurnal & Presensi",
            description: "Ubah catatan kasar menjadi laporan jurnal mengajar resmi secara otomatis.",
            icon: ClipboardList,
            colorTheme: "orange" as ColorTheme
        },
        {
            href: "/grader",
            title: "Smart Grader",
            description: "Koreksi jawaban siswa dari foto secara otomatis dengan kecerdasan AI.",
            icon: CheckCircle,
            colorTheme: "rose" as ColorTheme
        }
    ];
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-emerald-100/50 to-teal-100/50 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Main Container */}
            <div className="max-w-6xl w-full z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header Area */}
                <div className="text-center max-w-2xl mx-auto mb-16 mt-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 mb-8 mx-auto">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                        CogniEdu: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Asisten Guru AI</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
                        Tingkatkan efisiensi mengajar Anda. Hasilkan perangkat pembelajaran dan soal evaluasi berkualitas tinggi sesuai Kurikulum Merdeka dan Kurikulum Madrasah hanya dalam hitungan detik.
                    </p>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">

                    {features.map((feat, idx) => (
                        <FeatureCard
                            key={idx}
                            href={feat.href}
                            title={feat.title}
                            description={feat.description}
                            icon={feat.icon}
                            colorTheme={feat.colorTheme}
                        />
                    ))}

                </div>

                {/* Footer Area */}
                <div className="mt-20 text-center">
                    <p className="text-sm font-medium text-slate-400">
                        &copy; {new Date().getFullYear()} CogniEdu. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
