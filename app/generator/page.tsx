"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, FileText, Copy, Download, Loader2, Sparkles, ChevronDown, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GeneratorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Memuat Editor...</p>
      </div>
    }>
      <GeneratorContent />
    </Suspense>
  );
}

function GeneratorContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [aiResponse, setAiResponse] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [paperSize, setPaperSize] = useState('A4');
  const [formData, setFormData] = useState({
    mode: modeParam === 'rpp' ? 'rpp_ringkas' : modeParam === 'modul' ? 'modul_komprehensif' : modeParam === 'soal' ? 'hots' : 'rpp_ringkas',
    institution: 'umum',
    level: '',
    subject: '',
    topic: '',
    namaSekolah: '',
    namaGuru: '',
    nip: '',
    alokasiWaktu: '',
    // Khusus Soal
    pgCount: 10,
    pgOptions: '4',
    essayCount: 5,
    difficulty: 'proporsional'
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
      const res = await fetch('/api/generate', {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">CogniEdu</h1>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Asisten Guru</p>
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mode Asisten</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 pr-10 transition-colors cursor-pointer"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="rpp_ringkas">Buat RPP (Ringkas)</option>
                  <option value="modul_komprehensif">Buat Modul Ajar (Komprehensif)</option>
                  <option value="hots">Buat Soal Evaluasi (HOTS)</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Segmented Control Instansi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Instansi</label>
              <div className="flex p-1 bg-slate-200/60 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, institution: 'umum' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.institution === 'umum'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Sekolah Umum
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, institution: 'madrasah' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.institution === 'madrasah'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Madrasah
                </button>
              </div>
            </div>

            {/* Identitas Sekolah & Guru Section */}
            <div className="p-4 bg-slate-100/50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">Identitas Sekolah & Guru</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Sekolah</label>
                <input
                  type="text"
                  placeholder="misal: MA Al-Khoir"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400"
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Guru</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Guru"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400"
                  value={formData.namaGuru}
                  onChange={(e) => setFormData({ ...formData, namaGuru: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">NIP / NIK</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Alokasi Waktu</label>
                  <input
                    type="text"
                    placeholder="misal: 2 x 45 Menit"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400"
                    value={formData.alokasiWaktu}
                    onChange={(e) => setFormData({ ...formData, alokasiWaktu: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jenjang & Kelas</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 pr-10 transition-colors cursor-pointer"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                >
                  <option value="" disabled>Pilih Jenjang & Kelas...</option>
                  {formData.institution === 'umum' ? (
                    <>
                      <option value="7-smp">Kelas 7 SMP</option>
                      <option value="8-smp">Kelas 8 SMP</option>
                      <option value="9-smp">Kelas 9 SMP</option>
                      <option value="10-sma">Kelas 10 SMA</option>
                      <option value="11-sma">Kelas 11 SMA</option>
                      <option value="12-sma">Kelas 12 SMA</option>
                    </>
                  ) : (
                    <>
                      <option value="7-mts">Kelas 7 MTs</option>
                      <option value="8-mts">Kelas 8 MTs</option>
                      <option value="9-mts">Kelas 9 MTs</option>
                      <option value="10-ma">Kelas 10 MA</option>
                      <option value="11-ma">Kelas 11 MA</option>
                      <option value="12-ma">Kelas 12 MA</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mata Pelajaran</label>
              <input
                type="text"
                required
                placeholder={formData.institution === 'madrasah' ? "misal: Fikih, Akidah Akhlak" : "misal: Matematika, Biologi"}
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Topik / Materi Pokok</label>
              <textarea
                required
                rows={4}
                placeholder="Jelaskan topik atau materi pokok yang ingin dibahas..."
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors placeholder:text-slate-400 resize-none"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>

            {/* Form Dinamis Khusus Soal */}
            {formData.mode === 'hots' && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">Pengaturan Soal</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Jumlah PG</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors"
                      value={formData.pgCount}
                      onChange={(e) => setFormData({ ...formData, pgCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Opsi PG</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 pr-10 transition-colors cursor-pointer"
                        value={formData.pgOptions}
                        onChange={(e) => setFormData({ ...formData, pgOptions: e.target.value })}
                      >
                        <option value="4">4 (A, B, C, D)</option>
                        <option value="5">5 (A, B, C, D, E)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Jumlah Esai</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-colors"
                      value={formData.essayCount}
                      onChange={(e) => setFormData({ ...formData, essayCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Kesulitan</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 pr-10 transition-colors cursor-pointer"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      >
                        <option value="mudah">Mudah</option>
                        <option value="sedang">Sedang</option>
                        <option value="sulit">Sulit</option>
                        <option value="proporsional">Campuran</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus:ring-4 focus:ring-emerald-500/30 font-medium rounded-xl text-sm px-5 py-3.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate dengan AI ✨
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
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Belum ada dokumen</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Silakan isi form di sebelah kiri dan klik "Generate dengan AI" untuk mulai menghasilkan Modul Ajar atau Soal Evaluasi.
              </p>
            </div>
          )}

          {/* State Loading */}
          {status === 'loading' && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 py-20">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-6" />
              <h2 className="text-lg font-medium text-slate-800 mb-2">Sedang Meracik dengan AI...</h2>
              <p className="text-slate-500 text-sm">Menyusun struktur dokumen yang optimal untuk Anda.</p>

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
              <div className="prose prose-slate prose-emerald max-w-none">

                {/* Document Header */}
                <div className="border-b border-slate-200 pb-8 mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    {formData.mode === 'rpp_ringkas' ? 'RPP (Ringkas)' : formData.mode === 'modul_komprehensif' ? 'Modul Ajar (Komprehensif)' : 'Soal Evaluasi HOTS'}: {formData.subject || 'Mata Pelajaran'}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">Jenjang/Kelas:</span>
                      {formData.level ? formData.level.replace('-', ' ').toUpperCase() : 'Belum ditentukan'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">Topik:</span>
                      {formData.topic || 'Belum ditentukan'}
                    </div>
                    {formData.mode === 'hots' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">Struktur Soal:</span>
                        {formData.pgCount} PG, {formData.essayCount} Esai ({formData.difficulty})
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">Alokasi Waktu:</span>
                        {formData.alokasiWaktu || '2 x 45 Menit'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Body (Hasil AI) */}
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]">
                  <div className="prose max-w-none prose-emerald print:text-black print:w-full" ref={resultRef}>
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
