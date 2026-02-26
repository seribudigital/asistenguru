import { NextRequest, NextResponse } from 'next/server';
import ai, { MODEL_NAME } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tanggal, kelas, mapel, alokasiWaktu, siswaSakit, siswaIzin, siswaAlpha, catatanKasar } = body;

        const systemInstruction = `PERAN: Anda adalah Administrator Pendidikan dan Kepala Sekolah yang sangat ahli dalam menyusun tata bahasa laporan resmi.
TUGAS: Ubah 'Catatan Kasar' guru menjadi 'Jurnal Pelaksanaan Pembelajaran' yang sangat formal, rapi, dan berstandar dinas pendidikan.

FORMAT OUTPUT WAJIB:

KOP DOKUMEN: Buat header tebal berisi Hari/Tanggal, Kelas, Mata Pelajaran, dan Alokasi Waktu.

REKAP PRESENSI: Buat daftar siapa saja yang Sakit, Izin, Alpha berdasarkan input. Jika input kosong, tulis 'Nihil'.

URAIAN KEGIATAN: (Ini yang paling penting). Ubah catatan kasar guru menjadi 2-3 paragraf narasi deskriptif yang menggunakan bahasa baku, profesional, dan mencerminkan proses pedagogik yang baik.

CATATAN KHUSUS / TINDAK LANJUT: Berikan rekomendasi tindak lanjut singkat berdasarkan narasi tersebut.

ATURAN: JANGAN gunakan format tabel Markdown rumit, cukup gunakan list standar. Dilarang ngobrol/monolog.`;

        const prompt = `Data Input Form Jurnal:
- Hari/Tanggal: ${tanggal}
- Kelas: ${kelas}
- Mata Pelajaran: ${mapel}
- Alokasi Waktu: ${alokasiWaktu}
- Presensi:
  Sakit: ${siswaSakit || 'Nihil'}
  Izin: ${siswaIzin || 'Nihil'}
  Alpha: ${siswaAlpha || 'Nihil'}

- Catatan Kasar Guru:
${catatanKasar}

Buatlah Jurnal Pelaksanaan Pembelajaran resmi berdasarkan instruksi sistem dan data input di atas.`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return NextResponse.json({
            success: true,
            reply: response.text
        });

    } catch (error: any) {
        console.error("API Error generating Jurnal content:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Terjadi kesalahan pada server saat meracik jurnal."
        }, { status: 500 });
    }
}
