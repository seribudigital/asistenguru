import { NextRequest, NextResponse } from 'next/server';
import ai from '@/lib/gemini';

const KB_MADRASAH = `
ACUAN: Keputusan Menteri Agama (KMA) Nomor 1503 Tahun 2025.
PRINSIP UTAMA: Kurikulum madrasah menekankan pada Pembelajaran Mendalam dan Kurikulum Berbasis Cinta.
PENTING UNTUK SOAL EKSAKTA/MATEMATIKA: Integrasikan nilai-nilai ini secara NATURAL. JANGAN memaksakan kata "Cinta", "Kasih Sayang", atau "Agama" jika tidak relevan dengan konsep matematisnya. Cukup gunakan konteks dunia nyata yang bermanfaat (seperti teknologi, lingkungan, atau penyelesaian masalah sehari-hari) sebagai perwujudan peduli lingkungan dan sesama.
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mode, institution, level, subject, topic, pgCount, pgOptions, essayCount, difficulty, namaSekolah, namaGuru, nip, alokasiWaktu } = body;

        // Persiapkan variabel sistem berdasarkan input form
        let systemInstruction = "";

        if (institution === 'madrasah') {
            systemInstruction += `Anda adalah Asisten Guru Madrasah profesional.\n${KB_MADRASAH}\n\n`;
        } else if (institution === 'umum') {
            systemInstruction += "Anda adalah Asisten Guru Sekolah Umum profesional. Seluruh konten yang Anda hasilkan HARUS mengacu pada 'Permendikdasmen No 13 Tahun 2025' serta sangat menekankan prinsip Pembelajaran Mendalam (Deep Learning: Mindful, Meaningful, Joyful) dalam setiap elemen konten.\n\n";
        }

        systemInstruction += `ATURAN KOP DOKUMEN (HEADER):
Pada baris PALING ATAS hasil teks Anda, WAJIB buatkan header/identitas dokumen yang rapi menggunakan data berikut ini:

Nama Sekolah: ${namaSekolah || '-'}
Mata Pelajaran: ${subject || '-'}
Kelas/Fase: ${level ? level.replace('-', ' ').toUpperCase() : '-'}
Topik/Materi: ${topic || '-'}
Alokasi Waktu: ${alokasiWaktu || '-'}
Nama Guru: ${namaGuru || '-'}
NIP/NIK: ${nip || '-'}

Buat format headernya sejajar, rapi, profesional, dan tebal pada bagian labelnya (misal: **Nama Sekolah:** ${namaSekolah || '-'}). Setelah header, beri garis pemisah imajiner (---) sebelum masuk ke isi RPP/Soal.\n\n`;

        systemInstruction += `ATURAN MUTLAK FORMATTING & PENULISAN:
- ANTI-LATEX (MATEMATIKA): DILARANG KERAS menggunakan format LaTeX (simbol $ atau $$). Tuliskan rumus matematika menggunakan teks keyboard biasa agar mudah di-copy ke Word (Misal: ketik 5^2, x/y, 30 derajat Celcius).
- ANTI-AUTO LIST (PENTING): JANGAN gunakan titik setelah angka atau huruf untuk daftar (seperti 1. atau A.). Ini akan merusak format saat disalin. WAJIB gunakan tanda kurung tutup.
Contoh Benar:
Pertanyaan soal nomor satu...
A) Opsi pertama
B) Opsi kedua
- BARIS BARU UNTUK OPSI: Pastikan setiap opsi pilihan ganda (A, B, C, D) dicetak pada BARIS BARU (gunakan Enter/Line break), BUKAN menyambung dalam satu paragraf.
- PEMBAHASAN SUPER SINGKAT: Pembahasan soal ditujukan untuk GURU. Buat SANGAT SINGKAT, langsung to-the-point ke inti perhitungan/konsep (Maksimal 2-3 kalimat per soal). Dilarang bertele-tele.\n\n`;

        // 2. Logika Mode (Prompt Utama)
        let prompt = "";

        if (mode === 'rpp_ringkas') {
            systemInstruction += "Tugas Anda adalah membuat Rencana Pelaksanaan Pembelajaran (RPP) yang SINGKAT dan praktis (maksimal 2 halaman). Fokus hanya pada: Informasi Umum, Tujuan Pembelajaran, Langkah-langkah (Pendahuluan, Inti, Penutup), dan Asesmen Dasar.";

            prompt = `Buatlah Rencana Pelaksanaan Pembelajaran (RPP) yang SINGKAT dan praktis (maksimal 2 halaman) untuk:
- Mata Pelajaran: ${subject}
- Jenjang/Kelas: ${level.replace('-', ' ').toUpperCase()}
- Topik/Materi Pokok: ${topic}

Sajikan dalam format yang rapi dan terstruktur, gunakan kombinasi heading dan bullet points.`;

        } else if (mode === 'modul_komprehensif') {
            systemInstruction += "Tugas Anda adalah membuat Modul Ajar yang SANGAT LENGKAP (RPP Plus). Selain memuat komponen dasar RPP, Anda WAJIB menambahkan: 1) Ringkasan Materi Pendukung yang detail, 2) Rekomendasi Media/Sumber Belajar (seperti ide video atau tautan digital), 3) Draft Lembar Kerja Peserta Didik (LKPD), dan 4) Rubrik Penilaian Formatif/Sumatif yang terperinci. Gunakan gaya bahasa yang inspiratif.";

            prompt = `Buatlah Modul Ajar yang SANGAT LENGKAP (RPP Plus) untuk:
- Mata Pelajaran: ${subject}
- Jenjang/Kelas: ${level.replace('-', ' ').toUpperCase()}
- Topik/Materi Pokok: ${topic}

Sajikan dalam format yang rapi dan terstruktur, gunakan kombinasi heading dan bullet points.`;

        } else if (mode === 'hots') {
            systemInstruction += `Tugas Anda adalah membuat instrumen evaluasi (soal-soal) berbasis HOTS (Higher Order Thinking Skills).

ATURAN MUTLAK PEMBUATAN SOAL & FORMATTING (WAJIB DIIKUTI 100%):

PROTOKOL HITUNGAN MATEMATIKA (ANTI-BOCOR):

URUTAN KERJA: Anda WAJIB menghitung dan memastikan jawaban benarnya TERLEBIH DAHULU di sistem internal Anda. SETELAH menemukan angka pasti, BARULAH Anda tuliskan opsi A, B, C, D, E.

JAWABAN WAJIB ADA: Salah satu dari opsi yang Anda buat WAJIB berisi angka pasti dari hasil perhitungan Anda. Dilarang keras membuat soal "Zonk" (tidak ada jawaban).

LARANGAN MONOLOG KERAS: HARAM HUKUMNYA menuliskan proses trial-and-error, keraguan, atau perbaikan diri ke dalam output akhir. DILARANG menggunakan kata-kata: "Ralat", "Oops", "Mari kita hitung ulang", "Ternyata salah", atau "Asumsi ada kesalahan soal". Output harus terlihat meyakinkan seperti buku cetak resmi yang sudah di-proofread sempurna.

ANTI-LATEX (MATEMATIKA): DILARANG KERAS menggunakan format LaTeX (simbol $ atau $$). Tuliskan rumus menggunakan teks keyboard biasa (Misal: ketik 5^2, x/y, 30 derajat).

ANTI-AUTO LIST: JANGAN gunakan titik setelah angka/huruf untuk daftar (seperti 1. atau A.). WAJIB gunakan tanda kurung tutup.
Contoh:

Pertanyaan soal...
A) Opsi pertama
B) Opsi kedua

BARIS BARU UNTUK OPSI: Setiap opsi ganda wajib berada di baris baru (enter).

PEMBAHASAN SUPER SINGKAT: Pembahasan hanya untuk GURU. Berikan 1-2 kalimat langsung ke rumus/perhitungannya saja. Dilarang menceramahi nilai-nilai kurikulum di bagian pembahasan soal matematika.\n\n`;

            prompt = `Buatlah paket Soal Evaluasi HOTS untuk:
- Mata Pelajaran: ${subject}
- Jenjang/Kelas: ${level.replace('-', ' ').toUpperCase()}
- Topik/Materi Pokok: ${topic}
- Tingkat Kesulitan: ${difficulty.toUpperCase()}

Kriteria dan Struktur Soal:
1. Soal Pilihan Ganda: Buatkan tepat ${pgCount} butir soal pilihan ganda. Setiap soal harus memiliki ${pgOptions} opsi jawaban (misal A, B, C, D${pgOptions === '5' ? ', E' : ''}). Soal tidak boleh sekadar hafalan, melainkan analisis dan pemecahan masalah.
2. Soal Esai / Uraian: Buatkan tepat ${essayCount} butir soal esai HOTS terbuka yang mendorong siswa berpikir kritis.
3. KUNCI JAWABAN & PEMBAHASAN: Di bagian paling akhir, sertakan kunci jawaban untuk semua soal beserta pembahasan singkat namun komprehensif mengapa jawaban tersebut benar.

Sajikan dalam format yang sangat jelas, pisahkan bagian soal dan bagian kunci jawaban dengan jelas.`;
        }

        // Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
        console.error("API Error generating AI content:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Terjadi kesalahan pada server saat meracik konten."
        }, { status: 500 });
    }
}
