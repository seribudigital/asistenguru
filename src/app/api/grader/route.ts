import { NextRequest, NextResponse } from "next/server";
import ai, { MODEL_NAME } from "@/lib/gemini";

export const maxDuration = 60;

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
                model: MODEL_NAME,
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
"nilaiAkhir": angka_total_0_100,
"pgBenar": jumlah_soal_pg_yang_benar,
"esaiBenar": total_skor_esai_yang_didapat,
"tambahan": skor_tambahan_jika_ada_atau_0,
"rincianPG": {"1": "B", "2": "S", "3": "B"}, // B=Benar, S=Salah untuk tiap nomor PG yang ada
"rincianEsai": {"1": skor_esai_1, "2": skor_esai_2}, // Angka skor untuk tiap nomor esai
"topikLemah": "Sebutkan 1 topik materi dari soal yang salah",
"feedback": "Feedback singkat 1 kalimat"
}`
            });

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
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
                        parsed = { nilaiAkhir: 0, feedback: rawText.slice(0, 200), topikLemah: "-", rincianPG: {}, rincianEsai: {} };
                    }
                } else {
                    parsed = { nilaiAkhir: 0, feedback: rawText.slice(0, 200), topikLemah: "-", rincianPG: {}, rincianEsai: {} };
                }
            }

            // Sisipkan nama siswa dan kembalikan
            return NextResponse.json({
                success: true,
                result: {
                    nama: namaSiswa,
                    nilaiAkhir: typeof parsed.nilaiAkhir === "number" ? parsed.nilaiAkhir : parseInt(parsed.nilaiAkhir) || 0,
                    pgBenar: typeof parsed.pgBenar === "number" ? parsed.pgBenar : parseInt(parsed.pgBenar) || 0,
                    esaiBenar: typeof parsed.esaiBenar === "number" ? parsed.esaiBenar : parseInt(parsed.esaiBenar) || 0,
                    tambahan: typeof parsed.tambahan === "number" ? parsed.tambahan : parseInt(parsed.tambahan) || 0,
                    rincianPG: parsed.rincianPG || {},
                    rincianEsai: parsed.rincianEsai || {},
                    topikLemah: parsed.topikLemah || "-",
                    feedback: parsed.feedback || "-",
                },
            });
        }

        // === TAHAP 3: ANALYZE CLASS ===
        if (action === "ANALYZE_CLASS") {
            const { classResults } = body as {
                classResults: { nama: string; nilaiAkhir: number; feedback: string; topikLemah: string }[];
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
                model: MODEL_NAME,
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
