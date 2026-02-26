# CogniEdu - Asisten Guru AI

CogniEdu adalah aplikasi asisten pintar berbasis *Artificial Intelligence* (AI) terintegrasi yang dirancang khusus untuk membantu meringankan beban kerja guru di Indonesia. Aplikasi ini mampu membuat berbagai kelengkapan administrasi dan evaluasi pembelajaran secara otomatis, cepat, dan disesuaikan dengan Kurikulum Merdeka atau Kurikulum Madrasah.

## ✨ Fitur Utama

- **📝 RPP Ringkas:** Hasilkan Rencana Pelaksanaan Pembelajaran (RPP) harian yang terstruktur.
- **📚 Modul Ajar:** Buat Modul Ajar komprehensif lengkap dengan materi pendukung dan Lembar Kerja Peserta Didik (LKPD).
- **🎯 Soal Evaluasi:** Otomasi pembuatan paket soal *Higher Order Thinking Skills* (HOTS) berupa pilihan ganda dan esai beserta kunci jawabannya.
- **📋 Jurnal & Presensi:** Ubah catatan kasar harian menjadi laporan jurnal mengajar resmi secara instan.
- **✅ Smart Grader:** Sistem koreksi jawaban siswa dari foto secara otomatis dengan kecerdasan AI.

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan teknologi web modern:
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library UI:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ikonografi:** [Lucide React](https://lucide.dev/)
- **Markdown Renderer:** `react-markdown`
- **AI Integration:** [Google GenAI SDK](https://github.com/google/genai-js) (Model Gemini)
- **Bahasa:** TypeScript

## 🚀 Cara Menjalankan Secara Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek CogniEdu di komputer Anda:

1. **Clone Repository (Opsional jika sudah ada)**
   ```bash
   git clone https://github.com/seribudigital/asistenguru.git
   cd asisten-guru
   ```

2. **Instal Dependensi**
   Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (disarankan versi LTS).
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Konfigurasi Environment Variables**
   Buat atau edit file bernama `.env.local` di *root directory* proyek, lalu tambahkan API Key dari Google Gemini Anda:
   ```env
   GEMINI_API_KEY=api_key_gemini_anda_di_sini
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

5. **Akses Aplikasi**
   Buka browser Anda dan akses [http://localhost:3000](http://localhost:3000) untuk mulai menggunakan CogniEdu.

---
*Dibuat untuk memajukan pendidikan Indonesia.* 🇮🇩
