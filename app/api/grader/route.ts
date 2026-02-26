import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        // === TAHAP 1: GENERATE MASTER KEY ===
        if (action === "GENERATE_MASTER") {
            const { images } = body as {
                images: { data: string; mimeType: string }[];
            };

            if (!images || images.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Minimal 1 gambar soal diperlukan." },
                    { status: 400 }
                );
            }

            const parts: any[] = images.map(
                (img: { data: string; mimeType: string }) => ({
                    inlineData: { mimeType: img.mimeType, data: img.data },
                })
            );

            parts.push({
                text: "Baca lembar soal ini. Buatkan Kunci Jawaban yang akurat. WAJIB sertakan PEMETAAN TOPIK untuk setiap soal. Tulis dalam plain text biasa tanpa markdown tebal.",
            });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts }],
                config: { temperature: 0.3 },
            });

            return NextResponse.json({ success: true, reply: response.text });
        }

        // === TAHAP 2: GRADE STUDENT ===
        if (action === "GRADE_STUDENT") {
            const { images, kunciJawaban, aturanBobot, namaSiswa } = body as {
                images: { data: string; mimeType: string }[];
                kunciJawaban: string;
                aturanBobot?: string;
                namaSiswa: string;
            };

            if (!images || images.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Minimal 1 gambar jawaban siswa diperlukan." },
                    { status: 400 }
                );
            }

            // Bangun parts: semua gambar jawaban siswa + prompt koreksi
            const parts: any[] = images.map(
                (img: { data: string; mimeType: string }) => ({
                    inlineData: { mimeType: img.mimeType, data: img.data },
                })
            );

            parts.push({
                text: `Anda adalah Asesor Pendidikan. Tugas Anda mengoreksi lembar jawaban siswa (gambar) secara sangat teliti.

PEDOMAN PENILAIAN:

Kunci Jawaban: ${kunciJawaban}

Aturan Bobot: ${aturanBobot || ""} (Jika kosong, gunakan bobot standar proporsional hingga total 100).

TUGAS ANALISIS:

Hitung berapa Pilihan Ganda (PG) yang Benar dan Salah. Catat kunci vs jawaban siswa.

Beri skor spesifik untuk setiap soal Esai.

Hitung Nilai Akhir (0-100).

WAJIB KEMBALIKAN HANYA FORMAT JSON VALID (tanpa backticks/markdown block) dengan struktur persis seperti ini:
{
"nilai": angka_total,
"pgBenar": jumlah_angka_pg_benar,
"pgSalah": jumlah_angka_pg_salah,
"detailPG": "String singkat daftar jawaban, misal: 1:Kunci A(Siswa B), 2:Kunci C(Siswa C)",
"detailEsai": "String rincian nilai, misal: Esai 1=10 poin, Esai 2=15 poin",
"topikLemah": "Sebutkan 1 topik materi soal yang salah",
"rincian": "Feedback singkat 1 kalimat"
}`
            });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts }],
                config: { temperature: 0.2 },
            });

            const rawText = response.text || "";

            // Parse JSON dari output Gemini (handle kemungkinan markdown wrapping)
            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch {
                // Coba extract JSON dari teks
                const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    try {
                        parsed = JSON.parse(jsonMatch[0]);
                    } catch {
                        parsed = { nilai: 0, rincian: rawText.slice(0, 200), topikLemah: "-" };
                    }
                } else {
                    parsed = { nilai: 0, rincian: rawText.slice(0, 200), topikLemah: "-" };
                }
            }

            // Sisipkan nama siswa dan kembalikan
            return NextResponse.json({
                success: true,
                result: {
                    nama: namaSiswa,
                    nilai: typeof parsed.nilai === "number" ? parsed.nilai : parseInt(parsed.nilai) || 0,
                    pgBenar: typeof parsed.pgBenar === "number" ? parsed.pgBenar : parseInt(parsed.pgBenar) || 0,
                    pgSalah: typeof parsed.pgSalah === "number" ? parsed.pgSalah : parseInt(parsed.pgSalah) || 0,
                    detailPG: parsed.detailPG || "-",
                    detailEsai: parsed.detailEsai || "-",
                    rincian: parsed.rincian || "-",
                    topikLemah: parsed.topikLemah || "-",
                },
            });
        }

        // === TAHAP 3: ANALYZE CLASS ===
        if (action === "ANALYZE_CLASS") {
            const { classResults } = body as {
                classResults: { nama: string; nilai: number; rincian: string; topikLemah: string }[];
            };

            if (!classResults || classResults.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Data siswa kosong." },
                    { status: 400 }
                );
            }

            const dataJson = JSON.stringify(classResults, null, 2);

            const prompt = `Anda adalah Konsultan Evaluasi Pendidikan Ahli. Berikut adalah data hasil ujian dari satu kelas (${classResults.length} siswa):

${dataJson}

TUGAS: Buatkan Laporan Analisis Kelas yang sangat profesional menggunakan format Markdown (tanpa LaTeX, tanpa code block).

STRUKTUR WAJIB:

## 📊 Ringkasan Performa
- Rata-rata kelas, nilai tertinggi & terendah
- Jumlah siswa tuntas/tidak tuntas (asumsi KKM 75)
- Distribusi nilai (berapa siswa di range 90-100, 75-89, 50-74, <50)

## 📌 Pemetaan Topik Terlemah
- Analisis topik apa yang paling banyak salah dijawab berdasarkan data 'topikLemah'
- Berikan estimasi persentase siswa yang lemah di topik tersebut

## 🔴 Fokus Remedial
- Sebutkan nama-nama siswa yang butuh perhatian khusus (nilai < 75)
- Berikan catatan singkat per siswa tentang materi apa yang perlu diperkuat

## 💡 Rekomendasi Strategi
- Berikan 2-3 saran praktis dan konkret untuk guru di pertemuan berikutnya
- Fokus pada topik terlemah dan metode pengajaran yang disarankan

ATURAN:
- Gunakan bahasa Indonesia yang formal dan profesional.
- Jangan gunakan LaTeX.
- Langsung mulai dari heading laporan.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { temperature: 0.5 },
            });

            return NextResponse.json({ success: true, reply: response.text });
        }

        // Action tidak dikenali
        return NextResponse.json(
            { success: false, error: "Action tidak dikenali." },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("API Error Smart Grader:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Terjadi kesalahan pada server.",
            },
            { status: 500 }
        );
    }
}
