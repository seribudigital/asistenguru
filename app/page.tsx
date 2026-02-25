import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Target, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

                    {/* Card 1: RPP Ringkas */}
                    <Link href="/generator?mode=rpp" className="group">
                        <div className="h-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:bg-emerald-100/50 transition-colors" />
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">RPP Ringkas</h2>
                            <p className="text-slate-600 leading-relaxed text-sm mb-6 flex-1">
                                Buat Rencana Pelaksanaan Pembelajaran harian yang padat dan terstruktur.
                            </p>
                            <div className="flex items-center text-sm font-semibold text-emerald-600 gap-2 mt-auto">
                                Buka Generator <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Modul Ajar */}
                    <Link href="/generator?mode=modul" className="group">
                        <div className="h-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 group-hover:bg-teal-100/50 transition-colors" />
                            <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">Modul Ajar</h2>
                            <p className="text-slate-600 leading-relaxed text-sm mb-6 flex-1">
                                Buat Modul Ajar komprehensif lengkap dengan materi pendukung dan LKPD.
                            </p>
                            <div className="flex items-center text-sm font-semibold text-teal-600 gap-2 mt-auto">
                                Buka Generator <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Soal Evaluasi */}
                    <Link href="/generator?mode=soal" className="group">
                        <div className="h-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 group-hover:bg-indigo-100/50 transition-colors" />
                            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                                <Target className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">Soal Evaluasi</h2>
                            <p className="text-slate-600 leading-relaxed text-sm mb-6 flex-1">
                                Buat paket soal HOTS pilihan ganda dan esai beserta kunci jawabannya.
                            </p>
                            <div className="flex items-center text-sm font-semibold text-indigo-600 gap-2 mt-auto">
                                Buka Generator <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

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
