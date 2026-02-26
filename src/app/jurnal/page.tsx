"use client";

import React, { useState, useRef, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipboardList, Copy, Download, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JurnalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-sm text-slate-500 font-medium">Memuat Editor...</p>
            </div>
        }>
            <JurnalContent />
        </Suspense>
    );
}

function JurnalContent() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [aiResponse, setAiResponse] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [paperSize, setPaperSize] = useState('A4');
    const [formData, setFormData] = useState({
        tanggal: '',
        kelas: '',
        mapel: '',
        alokasiWaktu: '',
        siswaSakit: '',
        siswaIzin: '',
        siswaAlpha: '',
        catatanKasar: ''
    });

    const resultRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        if (!resultRef.current) return;
        try {
            const html = resultRef.current.innerHTML;
            const text = resultRef.current.innerText;
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([text], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            // fallback
            try {
                await navigator.clipboard.writeText(resultRef.current.innerText || aiResponse);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (fallbackErr) {
                console.error('Fallback failed', fallbackErr);
            }
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setAiResponse('');

        try {
            const res = await fetch('/api/jurnal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                setAiResponse(data.reply);
                setStatus('success');
            } else {
                alert('Gagal: ' + data.error);
                setStatus('idle');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
            setStatus('idle');
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen font-sans text-slate-900 bg-white">
            <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize === 'F4' ? '210mm 330mm' : 'A4'};
            margin: 2cm;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .prose h1, .prose h2, .prose h3 { page-break-after: avoid; }
          .prose p, .prose li { page-break-inside: avoid; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

            {/* 1. Panel Kiri (Panel Kontrol / Input) */}
            <div className="w-full md:w-[35%] lg:w-[30%] bg-slate-50 border-r border-slate-200 flex flex-col h-auto md:h-screen md:sticky md:top-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:hidden">
                <div className="p-6 md:p-8 flex-1 flex flex-col">

                    {/* Tombol Kembali */}
                    <div className="mb-6 print:hidden">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Beranda
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm">
                            <ClipboardList className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Jurnal Cerdas</h1>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Asisten Guru</p>
                        </div>
                    </div>

                    {/* Form Input */}
                    <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-6">

                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">Informasi Umum</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tanggal</label>
                                <input
                                    type="text"
                                    placeholder="misal: Senin, 26 Februari 2026"
                                    required
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                    value={formData.tanggal}
                                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Kelas</label>
                                    <input
                                        type="text"
                                        placeholder="misal: X MIPA 1"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                        value={formData.kelas}
                                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Alokasi Waktu</label>
                                    <input
                                        type="text"
                                        placeholder="misal: 2 JP"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                        value={formData.alokasiWaktu}
                                        onChange={(e) => setFormData({ ...formData, alokasiWaktu: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Mata Pelajaran</label>
                                <input
                                    type="text"
                                    placeholder="misal: Matematika Wajib"
                                    required
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                    value={formData.mapel}
                                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">Presensi Kehadiran</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Sakit</label>
                                    <input
                                        type="text"
                                        placeholder="contoh: Budi, Ani"
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                        value={formData.siswaSakit}
                                        onChange={(e) => setFormData({ ...formData, siswaSakit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Izin</label>
                                    <input
                                        type="text"
                                        placeholder="contoh: Dina"
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                        value={formData.siswaIzin}
                                        onChange={(e) => setFormData({ ...formData, siswaIzin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Alpha</label>
                                    <input
                                        type="text"
                                        placeholder="contoh: Eko"
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400"
                                        value={formData.siswaAlpha}
                                        onChange={(e) => setFormData({ ...formData, siswaAlpha: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500">Kosongkan jika nihil otomatis.</p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-slate-700">Catatan Kasar Guru</label>
                            <textarea
                                required
                                rows={5}
                                placeholder="Ketik poin-poin kegiatan mengajar di sini. Contoh: Anak-anak hari ini belajar limit fungsi. Di awal pada bingung, tapi setelah dikasih contoh soal ujian tahun lalu mereka mulai paham. Sempat ada kuis kecil, rata-rata nilainya bagus."
                                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block p-3 transition-colors placeholder:text-slate-400 resize-none"
                                value={formData.catatanKasar}
                                onChange={(e) => setFormData({ ...formData, catatanKasar: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ukuran Kertas Cetak</label>
                            <div className="flex p-1 bg-slate-200/60 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setPaperSize('A4')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paperSize === 'A4'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    A4
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaperSize('F4')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paperSize === 'F4'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    F4
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 md:mt-auto pt-4 pb-4 md:pb-0">
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 focus:ring-4 focus:ring-orange-500/30 font-medium rounded-xl text-sm px-5 py-3.5 transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Jurnal ✨
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* 2. Panel Kanan (Canvas / Hasil Output) */}
            <div className="w-full md:w-[65%] lg:w-[70%] bg-white min-h-screen relative flex flex-col print:w-full print:block">

                {/* Action Buttons (Pojok Kanan Atas) */}
                {status === 'success' && (
                    <div className="absolute top-0 right-0 p-4 md:p-6 flex gap-3 z-10 w-full md:w-auto justify-end bg-white/80 backdrop-blur-sm border-b border-slate-100 md:border-none md:bg-transparent md:backdrop-blur-none print:hidden">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                        >
                            <Copy className="w-4 h-4" />
                            {isCopied ? 'Tersalin!' : 'Copy Text'}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-20 mt-12 md:mt-0">

                    {/* State Awal (Kosong) */}
                    {status === 'idle' && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-500 py-20">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                                <ClipboardList className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Belum ada jurnal</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Silakan isi form di sebelah kiri dan klik "Generate Jurnal ✨" untuk mengubah catatan kasar menjadi laporan resmi.
                            </p>
                        </div>
                    )}

                    {/* State Loading */}
                    {status === 'loading' && (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-6" />
                            <h2 className="text-lg font-medium text-slate-800 mb-2">Sedang Meracik dengan AI...</h2>
                            <p className="text-slate-500 text-sm">Menyusun tata bahasa laporan jurnal resmi.</p>

                            {/* Skeleton Loader (Simulasi teks yang sedang diketik) */}
                            <div className="w-full max-w-2xl mt-12 space-y-6 opacity-40">
                                <div className="h-8 bg-slate-200 rounded-md w-3/4 mx-auto animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded-md w-5/6 animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded-md w-4/6 animate-pulse"></div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* State Hasil (Success) */}
                    {status === 'success' && (
                        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 pb-20">
                            <div className="prose prose-slate prose-orange max-w-none">
                                {/* Document Body (Hasil AI) */}
                                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]">
                                    <div className="prose max-w-none prose-orange print:text-black print:w-full" ref={resultRef}>
                                        <ReactMarkdown>
                                            {aiResponse}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
