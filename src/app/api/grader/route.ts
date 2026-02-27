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

1. Baca jawaban pilihan ganda siswa dari gambar. Cocokkan dengan Kunci Jawaban.
2. Hitung berapa Pilihan Ganda (PG) yang Benar dan Salah.
3. Beri skor spesifik untuk setiap soal Esai (jika ada).
4. Hitung Nilai Akhir (total skor bobot yang didapat).

WAJIB KEMBALIKAN HANYA FORMAT JSON MURNI (tanpa backticks/markdown block) dengan struktur persis seperti ini:
{
"nilaiAkhir": angka_total_0_100,
"pgBenar": jumlah_soal_pg_yang_benar,
"esaiBenar": total_skor_esai_yang_didapat,
"tambahan": skor_tambahan_jika_ada_atau_0,
"rincianPG": {"1": "B", "2": "S", "3": "B"},
"rincianEsai": {"1": skor_esai_1, "2": skor_esai_2},
"topikLemah": "Sebutkan 1 topik materi dari soal yang salah",
"feedback": "Feedback singkat 1 kalimat",
"jawabanDetail": [
  { "nomor": 1, "jawaban": "A", "benar": true },
  { "nomor": 2, "jawaban": "B", "benar": false }
]
}`
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
                parsed = { nilaiAkhir: 0, feedback: "Gagal parse AI output.", topikLemah: "-", rincianPG: {}, rincianEsai: {}, jawabanDetail: [] };
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
                    jawabanDetail: parsed.jawabanDetail || [],
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
