"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
    CheckCircle,
    Loader2,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    ImagePlus,
    Camera,
    X,
    Users,
    Trash2,
    BarChart3,
    Download,
    KeyRound,
} from "lucide-react";
import Link from "next/link";

interface ClassResult {
    nama: string;
    nilai: number;
    rincian: string;
    topikLemah: string;
}

export default function GraderPage() {
    // === CORE STATE ===
    const [step, setStep] = useState(1);
    const [kunciJawaban, setKunciJawaban] = useState("");
    const [classResults, setClassResults] = useState<ClassResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [classAnalysis, setClassAnalysis] = useState("");

    // Step 1 file state
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Step 2 state
    const [namaSiswa, setNamaSiswa] = useState("");
    const [siswaFiles, setSiswaFiles] = useState<File[]>([]);
    const [siswaPreviews, setSiswaPreviews] = useState<string[]>([]);
    const siswaInputRef = useRef<HTMLInputElement>(null);

    // === HELPER: read files to base64 array ===
    const filesToBase64 = async (
        fileList: File[]
    ): Promise<{ data: string; mimeType: string }[]> => {
        return Promise.all(
            fileList.map(
                (file) =>
                    new Promise<{ data: string; mimeType: string }>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const dataUrl = reader.result as string;
                            const base64 = dataUrl.split(",")[1];
                            resolve({ data: base64, mimeType: file.type || "image/jpeg" });
                        };
                        reader.readAsDataURL(file);
                    })
            )
        );
    };

    // === HELPER: generic file input handler ===
    const handleFileAdd = (
        e: React.ChangeEvent<HTMLInputElement>,
        setF: React.Dispatch<React.SetStateAction<File[]>>,
        setP: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (!e.target.files) return;
        const incoming = Array.from(e.target.files).filter((f) =>
            f.type.startsWith("image/")
        );
        setF((prev) => [...prev, ...incoming]);
        incoming.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) =>
                setP((prev) => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removeFileAt = (
        index: number,
        setF: React.Dispatch<React.SetStateAction<File[]>>,
        setP: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setF((prev) => prev.filter((_, i) => i !== index));
        setP((prev) => prev.filter((_, i) => i !== index));
    };

    // === ACTION: Step 1 — Generate Kunci Jawaban ===
    const handleGenerate = async () => {
        if (files.length === 0) {
            alert("Upload minimal 1 foto lembar soal.");
            return;
        }
        setIsLoading(true);
        try {
            const images = await filesToBase64(files);
            const res = await fetch("/api/grader", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "GENERATE_MASTER", images }),
            });
            const data = await res.json();
            if (data.success) {
                setKunciJawaban(data.reply);
            } else {
                alert("Gagal: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan.");
        }
        setIsLoading(false);
    };

    // === ACTION: Step 2 — Koreksi Siswa ===
    const handleGradeStudent = async () => {
        if (!namaSiswa.trim()) {
            alert("Nama siswa wajib diisi.");
            return;
        }
        if (siswaFiles.length === 0) {
            alert("Upload minimal 1 foto jawaban siswa.");
            return;
        }
        setIsLoading(true);
        try {
            const images = await filesToBase64(siswaFiles);
            const res = await fetch("/api/grader", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "GRADE_STUDENT",
                    images,
                    kunciJawaban,
                    namaSiswa: namaSiswa.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setClassResults((prev) => [...prev, data.result]);
                // Reset form untuk siswa berikutnya
                setNamaSiswa("");
                setSiswaFiles([]);
                setSiswaPreviews([]);
            } else {
                alert("Gagal mengoreksi: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan.");
        }
        setIsLoading(false);
    };

    const removeStudent = (index: number) => {
        setClassResults((prev) => prev.filter((_, i) => i !== index));
    };

    // === ACTION: Step 3 — Analisis Kelas ===
    const handleAnalyzeClass = async () => {
        if (classResults.length === 0) {
            alert("Belum ada data siswa untuk dianalisis.");
            return;
        }
        setIsLoading(true);
        setClassAnalysis("");
        try {
            const res = await fetch("/api/grader", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ANALYZE_CLASS",
                    classResults,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setClassAnalysis(data.reply);
            } else {
                alert("Gagal: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan.");
        }
        setIsLoading(false);
    };

    // ===========================================================
    // STEPPER COMPONENT (Visual Timeline)
    // ===========================================================
    const stepperItems = [
        { n: 1, label: "Master Kunci", icon: KeyRound },
        { n: 2, label: "Koreksi Siswa", icon: Users },
        { n: 3, label: "Analisis Kelas", icon: BarChart3 },
    ];

    const Stepper = () => (
        <div className="flex items-center w-full mb-8 print:hidden">
            {stepperItems.map((s, i) => {
                const isCompleted = step > s.n;
                const isActive = step === s.n;
                const Icon = isCompleted ? CheckCircle : s.icon;

                return (
                    <React.Fragment key={s.n}>
                        {/* Connecting line (before each step except the first) */}
                        {i > 0 && (
                            <div className="flex-1 mx-1">
                                <div
                                    className={`h-1 rounded-full transition-colors duration-300 ${step > s.n
                                        ? "bg-emerald-400"
                                        : step >= s.n
                                            ? "bg-gradient-to-r from-emerald-400 to-indigo-400"
                                            : "bg-slate-200"
                                        }`}
                                />
                            </div>
                        )}

                        {/* Step node */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                    ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200"
                                    : isActive
                                        ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300 shadow-lg shadow-indigo-200/50"
                                        : "bg-slate-100 text-slate-300"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <span
                                className={`text-[11px] font-semibold transition-colors duration-300 ${isCompleted
                                    ? "text-emerald-600"
                                    : isActive
                                        ? "text-indigo-600"
                                        : "text-slate-400"
                                    }`}
                            >
                                {s.label}
                            </span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );

    // ===========================================================
    // STEP 3 — Laporan Analisis Kelas
    // ===========================================================
    if (step === 3) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                {/* Print CSS */}
                <style jsx global>{`
                    @media print {
                        @page { size: A4; margin: 2cm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                `}</style>

                <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                    {/* Back */}
                    <button
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 print:hidden"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Tabel
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8 print:hidden">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Smart Grader</h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                                Tahap 3 — Laporan Analisis Kelas
                            </p>
                        </div>
                    </div>

                    {/* Stepper */}
                    <Stepper />

                    {/* Content */}
                    {!classAnalysis && !isLoading && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                <BarChart3 className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">
                                Siap Menganalisis {classResults.length} Data Siswa
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                                AI akan membuat laporan analisis kelas lengkap: statistik performa, pemetaan topik lemah, daftar remedial, dan rekomendasi strategi mengajar.
                            </p>
                            <button
                                type="button"
                                onClick={handleAnalyzeClass}
                                className="inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus:ring-4 focus:ring-emerald-500/30 font-semibold rounded-xl text-sm px-8 py-3 shadow-md shadow-emerald-500/20 transition-all"
                            >
                                <Sparkles className="w-5 h-5" /> Generate Analisis Global ✨
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-6" />
                            <h2 className="text-lg font-medium text-slate-800 mb-2">Menganalisis Data Kelas...</h2>
                            <p className="text-slate-500 text-sm">Menghitung distribusi, pemetaan topik, dan menyusun rekomendasi.</p>
                            <div className="w-full max-w-lg mt-10 mx-auto space-y-4 opacity-30">
                                <div className="h-6 bg-slate-200 rounded-md w-3/4 mx-auto animate-pulse" />
                                <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse" />
                                <div className="h-4 bg-slate-200 rounded-md w-5/6 animate-pulse" />
                                <div className="h-4 bg-slate-200 rounded-md w-4/6 animate-pulse" />
                            </div>
                        </div>
                    )}

                    {classAnalysis && (
                        <div className="space-y-4">
                            {/* Action buttons */}
                            <div className="flex gap-3 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                                >
                                    <Download className="w-4 h-4" /> Download PDF Laporan
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Kembali ke Tabel
                                </button>
                            </div>

                            {/* Rendered Analysis */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
                                <div className="prose prose-slate prose-emerald max-w-none print:w-full print:text-black">
                                    <ReactMarkdown>{classAnalysis}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-8 print:hidden">
                        Smart Grader — CogniEdu AI
                    </p>
                </div>
            </div>
        );
    }

    // ===========================================================
    // STEP 2 — Koreksi Siswa & Tabel Rekap
    // ===========================================================
    if (step === 2) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                    {/* Back */}
                    <button
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Tahap 1
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Smart Grader
                            </h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                                Tahap 2 — Koreksi Per Siswa
                            </p>
                        </div>
                    </div>

                    {/* Stepper */}
                    <Stepper />

                    {/* Two Panel Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* ====== PANEL KIRI: Form Input ====== */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-6">
                                {/* Kunci Referensi */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Kunci Jawaban (Referensi)
                                    </label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-28 overflow-y-auto">
                                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                                            {kunciJawaban}
                                        </pre>
                                    </div>
                                </div>

                                {/* Nama Siswa */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Nama Siswa <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: Budi Santoso"
                                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-colors placeholder:text-slate-400"
                                        value={namaSiswa}
                                        onChange={(e) => setNamaSiswa(e.target.value)}
                                    />
                                </div>

                                {/* Upload Foto Jawaban Siswa */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        Foto Jawaban Siswa
                                    </label>
                                    <div
                                        onClick={() => siswaInputRef.current?.click()}
                                        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-all hover:bg-blue-50/30"
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Camera className="w-7 h-7 text-slate-400" />
                                            <ImagePlus className="w-7 h-7 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Buka Kamera 📸 / Pilih Galeri 📂
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Sentuh kotak ini dari HP Anda untuk langsung memfoto lembar kertas.
                                        </p>
                                    </div>
                                    <input
                                        ref={siswaInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                            handleFileAdd(e, setSiswaFiles, setSiswaPreviews)
                                        }
                                        className="hidden"
                                    />

                                    {/* Previews */}
                                    {siswaPreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {siswaPreviews.map((src, i) => (
                                                <div
                                                    key={i}
                                                    className="relative rounded-lg overflow-hidden border border-slate-200 group"
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Jawaban ${i + 1}`}
                                                        className="w-full h-20 object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFileAt(i, setSiswaFiles, setSiswaPreviews)
                                                        }
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <p className="text-[9px] text-slate-500 truncate px-1 py-0.5">
                                                        {siswaFiles[i]?.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {siswaFiles.length > 0 && (
                                        <p className="text-xs text-slate-500 font-medium">
                                            {siswaFiles.length} file siap diproses
                                        </p>
                                    )}
                                </div>

                                {/* Koreksi Button */}
                                <button
                                    type="button"
                                    onClick={handleGradeStudent}
                                    disabled={
                                        isLoading ||
                                        !namaSiswa.trim() ||
                                        siswaFiles.length === 0
                                    }
                                    className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 focus:ring-4 focus:ring-blue-500/30 font-semibold rounded-xl text-sm px-5 py-3 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />{" "}
                                            Mengoreksi...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" /> Koreksi &amp; Masukkan
                                            ke Tabel ✨
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ====== PANEL KANAN: Tabel Hasil ====== */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">
                                    📊 Rekap Nilai Kelas
                                </h2>
                                <p className="text-xs text-slate-500 mb-5">
                                    Data koreksi akan muncul di tabel ini setiap siswa selesai
                                    dikoreksi.
                                </p>

                                {classResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                                        <Users className="w-12 h-12 text-slate-300 mb-4" />
                                        <p className="text-slate-500 text-sm">
                                            Belum ada data siswa yang dikoreksi.
                                        </p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            Isi form di sebelah kiri untuk mulai mengoreksi.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-4 py-3 font-semibold text-slate-600 w-12">
                                                                No
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold text-slate-600">
                                                                Nama Siswa
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold text-slate-600 text-center w-20">
                                                                Nilai
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold text-slate-600">
                                                                Topik Terlemah
                                                            </th>
                                                            <th className="px-4 py-3 font-semibold text-slate-600 w-12"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {classResults.map((r, i) => (
                                                            <tr
                                                                key={i}
                                                                className="hover:bg-slate-50/50 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 text-slate-500 font-medium">
                                                                    {i + 1}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                                    {r.nama}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span
                                                                        className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-bold ${r.nilai >= 75
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : r.nilai >= 50
                                                                                ? "bg-amber-100 text-amber-700"
                                                                                : "bg-rose-100 text-rose-700"
                                                                            }`}
                                                                    >
                                                                        {r.nilai}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-md">
                                                                        {r.topikLemah}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => removeStudent(i)}
                                                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                                                        title="Hapus"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Summary footer */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                                <p className="text-sm text-slate-600">
                                                    <span className="font-semibold">
                                                        {classResults.length}
                                                    </span>{" "}
                                                    siswa terkoreksi
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    Rata-rata:{" "}
                                                    <span className="font-bold text-slate-900">
                                                        {(
                                                            classResults.reduce((a, b) => a + b.nilai, 0) /
                                                            classResults.length
                                                        ).toFixed(1)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Next Step */}
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="w-full mt-4 flex items-center justify-center gap-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 font-semibold rounded-xl text-sm px-5 py-3 transition-all"
                                        >
                                            Selesai &amp; Analisis Kelas →{" "}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-8">
                        Smart Grader — CogniEdu AI
                    </p>
                </div>
            </div>
        );
    }

    // ===========================================================
    // STEP 1 — Generate Kunci Jawaban (TIDAK BERUBAH)
    // ===========================================================
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
                >
                    ← Kembali ke Beranda
                </Link>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Smart Grader</h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                            Tahap 1 — Generate Kunci Jawaban
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <Stepper />

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                    {/* Info */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                        <p className="text-sm font-semibold text-rose-800 mb-1">
                            📄 Upload Foto Lembar Soal
                        </p>
                        <p className="text-xs text-rose-700/80 leading-relaxed">
                            Upload satu atau beberapa foto lembar soal. AI akan membaca soal
                            dan menghasilkan kunci jawaban beserta pemetaan topik secara
                            otomatis.
                        </p>
                    </div>

                    {/* File Upload Zone */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">
                            Foto Lembar Soal
                        </label>
                        <div
                            onClick={() => inputRef.current?.click()}
                            className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-xl p-8 text-center transition-all hover:bg-rose-50/30"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Camera className="w-8 h-8 text-slate-400" />
                                <ImagePlus className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                Buka Kamera 📸 / Pilih Galeri 📂
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Sentuh kotak ini dari HP Anda untuk langsung memfoto lembar kertas.
                            </p>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileAdd(e, setFiles, setPreviews)}
                            className="hidden"
                        />

                        {/* Previews */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {previews.map((src, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-lg overflow-hidden border border-slate-200 group"
                                    >
                                        <img
                                            src={src}
                                            alt={`Soal ${i + 1}`}
                                            className="w-full h-20 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFileAt(i, setFiles, setPreviews)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <p className="text-[9px] text-slate-500 truncate px-1 py-0.5">
                                            {files[i]?.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.length > 0 && (
                            <p className="text-xs text-slate-500 font-medium">
                                {files.length} file siap diproses
                            </p>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isLoading || files.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 focus:ring-4 focus:ring-rose-500/30 font-semibold rounded-xl text-sm px-5 py-3 shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" /> Generate Kunci &amp; Pemetaan
                                Topik
                            </>
                        )}
                    </button>

                    {/* Textarea Result */}
                    {kunciJawaban && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="text-sm font-medium text-slate-700">
                                Hasil Kunci Jawaban{" "}
                                <span className="text-slate-400 font-normal">
                                    (bisa diedit)
                                </span>
                            </label>
                            <textarea
                                rows={12}
                                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 p-3 font-mono leading-relaxed resize-y transition-colors"
                                value={kunciJawaban}
                                onChange={(e) => setKunciJawaban(e.target.value)}
                            />
                            <p className="text-[11px] text-amber-600 font-medium">
                                ⚠️ Periksa &amp; edit kunci jawaban di atas jika ada yang perlu
                                dikoreksi sebelum lanjut.
                            </p>

                            {/* Next Step */}
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full flex items-center justify-center gap-2 text-rose-700 bg-rose-100 hover:bg-rose-200 font-semibold rounded-xl text-sm px-5 py-3 transition-all"
                            >
                                Lanjut Koreksi Siswa →{" "}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    Smart Grader — CogniEdu AI
                </p>
            </div>
        </div>
    );
}
