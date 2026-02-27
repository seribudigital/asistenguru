import { NextRequest, NextResponse } from "next/server";
import ai, { MODEL_NAME } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        // === TAHAP 1: GENERATE MASTER KEY ===
        if (action === "GENERATE_MASTER") {
            const { images, jumlahPG } = body as {
                images: { data: string; mimeType: string }[];
                jumlahPG: string;
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
                text: `Baca lembar soal ini. Buatkan Kunci Jawaban yang akurat. WAJIB sertakan PEMETAAN TOPIK untuk setiap soal.

Kamu HANYA boleh mengekstrak soal Pilihan Ganda dari nomor 1 sampai nomor ${jumlahPG}.
BERHENTI membaca dan mengekstrak seketika setelah kamu mencapai nomor ${jumlahPG}.
Abaikan semua soal Uraian atau Esai. Ciri soal pilihan ganda adalah jawabannya HANYA berupa satu huruf (A, B, C, D, atau E). Jika kamu menemukan nomor yang mengulang dari 1 tetapi jawabannya berupa kalimat, ABAIKAN karena itu adalah soal Esai.

KEMBALIKAN HANYA FORMAT JSON ARRAY MURNI (tanpa backticks/markdown block) dengan struktur persis seperti ini untuk setiap soal:
[
  { "nomor": 1, "kunci": "A", "topik": "Biologi Sel", "bobot": 2 },
  { "nomor": 2, "kunci": "C", "topik": "Genetika", "bobot": 2 }
]`,
            });

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts }],
                config: { temperature: 0.1 },
            });

            // Parse output to ensure it's a valid JSON string (strip markdown)
            const rawText = response.text || "";
            let cleanedText = rawText.replace(/```json|```/g, "").trim();

            return NextResponse.json({ success: true, reply: cleanedText });
        }

        // === TAHAP 2: GRADE STUDENT ===
        if (action === "GRADE_STUDENT") {
            const { images, kunciJawaban, aturanBobot, namaSiswa, jumlahPG } = body as {
                images: { data: string; mimeType: string }[];
                kunciJawaban: string;
                aturanBobot?: string;
                namaSiswa: string;
                jumlahPG: string;
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

Kamu HANYA boleh mengekstrak soal Pilihan Ganda dari nomor 1 sampai nomor ${jumlahPG}.
BERHENTI membaca dan mengekstrak seketika setelah kamu mencapai nomor ${jumlahPG}.
Abaikan semua soal Uraian atau Esai. Ciri soal pilihan ganda adalah jawabannya HANYA berupa satu huruf (A, B, C, D, atau E). Jika kamu menemukan nomor yang mengulang dari 1 tetapi jawabannya berupa kalimat, ABAIKAN karena itu adalah soal Esai.

PEDOMAN PENILAIAN:

Kunci Jawaban JSON:
${kunciJawaban}

TUGAS ANALISIS:

1. Baca jawaban pilihan ganda siswa dari gambar.
2. Ekstrak HANYA nomor soal dan jawaban hurufnya (A/B/C/D/E).

WAJIB KEMBALIKAN HANYA FORMAT JSON MURNI (tanpa backticks/markdown block) dengan struktur persis seperti ini:
{
"jawabanDetail": [
  { "nomor": 1, "jawaban": "A" },
  { "nomor": 2, "jawaban": "B" }
]
}`,
            });

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts }],
                config: { temperature: 0.2 },
            });

            let rawText = response.text || "";
            rawText = rawText.replace(/```json|```/g, "").trim();

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch {
                parsed = { jawabanDetail: [] };
            }

            // ===== KALKULASI DETERMINISTIK MENGGUNAKAN JAVASCRIPT =====
            let calculatedPgBenar = 0;
            let totalBobotDidapat = 0;
            let totalBobotMaksimal = 0;
            let finalNilaiAkhir = 0;
            const jawabanDetailLengkap = parsed.jawabanDetail || [];

            // Variabel untuk analisis topik lemah
            const topicErrors: Record<string, number> = {};
            let finalTopikLemah = "-";
            let finalFeedback = "-";

            try {
                const masterKeyArray = JSON.parse(kunciJawaban);

                masterKeyArray.forEach((mk: any) => {
                    const bobotSoal = Number(mk.bobot) || 0;
                    totalBobotMaksimal += bobotSoal;

                    const studentAnswer = jawabanDetailLengkap.find((jd: any) => jd.nomor === mk.nomor);
                    if (studentAnswer) {
                        const isCorrect = (studentAnswer.jawaban || "").trim().toUpperCase() === (mk.kunci || "").trim().toUpperCase();
                        studentAnswer.benar = isCorrect;

                        if (isCorrect) {
                            calculatedPgBenar++;
                            totalBobotDidapat += bobotSoal;
                        } else {
                            // Hitung untuk topik lemah
                            if (mk.topik) {
                                topicErrors[mk.topik] = (topicErrors[mk.topik] || 0) + 1;
                            }
                        }
                    } else {
                        // Jika tidak terjawab, rekam sebagai salah
                        if (mk.topik) {
                            topicErrors[mk.topik] = (topicErrors[mk.topik] || 0) + 1;
                        }
                        jawabanDetailLengkap.push({ nomor: mk.nomor, jawaban: "-", benar: false });
                    }
                });

                if (totalBobotMaksimal > 0) {
                    finalNilaiAkhir = Math.round((totalBobotDidapat / totalBobotMaksimal) * 100);
                }

                // Cari topik yang paling banyak salah
                let maxErrors = 0;
                for (const [topic, errors] of Object.entries(topicErrors)) {
                    if (errors > maxErrors) {
                        maxErrors = errors;
                        finalTopikLemah = topic;
                    }
                }
            } catch (e) {
                // Fallback jika gagal parse
                console.warn("Gagal parse masterKey/jawaban", e);
            }

            // Dinamis Feedback
            if (finalNilaiAkhir >= 80) {
                finalFeedback = "Kerja yang sangat bagus! Pertahankan hasil belajarmu.";
            } else if (finalTopikLemah !== "-") {
                finalFeedback = `Nilai masih di bawah harapan. Silakan pelajari kembali dengan fokus pada materi: ${finalTopikLemah}.`;
            } else {
                finalFeedback = "Perbanyak latihan soal untuk meningkatkan pemahaman materi.";
            }

            // Sisipkan skor esai tambahan jika ada (saat ini belum ada UI-nya, diset 0)
            let finalEsaiBenar = 0;
            let finalTambahan = 0;

            // Sisipkan nama siswa dan kembalikan
            return NextResponse.json({
                success: true,
                result: {
                    nama: namaSiswa,
                    nilaiAkhir: finalNilaiAkhir,
                    pgBenar: calculatedPgBenar,
                    esaiBenar: finalEsaiBenar,
                    tambahan: finalTambahan,
                    rincianPG: {},
                    rincianEsai: {},
                    topikLemah: finalTopikLemah,
                    feedback: finalFeedback,
                    jawabanDetail: jawabanDetailLengkap,
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
