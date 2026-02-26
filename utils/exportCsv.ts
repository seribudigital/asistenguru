import { ClassResult } from "@/types/grader";

export const downloadCSV = (classResults: ClassResult[]) => {
    if (classResults.length === 0) {
        alert("Belum ada data untuk diunduh.");
        return;
    }

    // Langkah A: Cari tahu nomor soal PG terbanyak dan nomor Esai terbanyak
    let maxPG = 0;
    let maxEsai = 0;

    classResults.forEach((result) => {
        const pgKeys = Object.keys(result.rincianPG || {})
            .map(Number)
            .filter((n) => !isNaN(n));
        const esaiKeys = Object.keys(result.rincianEsai || {})
            .map(Number)
            .filter((n) => !isNaN(n));

        if (pgKeys.length > 0) {
            maxPG = Math.max(maxPG, ...pgKeys);
        }
        if (esaiKeys.length > 0) {
            maxEsai = Math.max(maxEsai, ...esaiKeys);
        }
    });

    // Langkah B: Buat Header CSV dinamis
    const headers = [
        "No",
        "Nama Siswa",
        "Nilai Akhir",
        "PG Benar",
        "Essai Benar",
        "Tambahan",
    ];

    for (let i = 1; i <= maxPG; i++) {
        headers.push(`PG ${i}`);
    }
    for (let i = 1; i <= maxEsai; i++) {
        headers.push(`esai ${i}`);
    }

    headers.push("Topik Terlemah", "Feedback");

    const csvRows = classResults.map((r, i) => {
        const row = [
            i + 1,
            `"${r.nama.replace(/"/g, '""')}"`,
            r.nilaiAkhir,
            r.pgBenar || 0,
            r.esaiBenar || 0,
            r.tambahan || 0,
        ];

        // Langkah C: iterasi per nilai key dinamis
        for (let j = 1; j <= maxPG; j++) {
            const pgVal =
                r.rincianPG && r.rincianPG[String(j)] ? r.rincianPG[String(j)] : "";
            row.push(`"${String(pgVal).replace(/"/g, '""')}"`);
        }

        for (let j = 1; j <= maxEsai; j++) {
            const esaiVal =
                r.rincianEsai && r.rincianEsai[String(j)] !== undefined
                    ? r.rincianEsai[String(j)]
                    : "";
            row.push(`"${String(esaiVal).replace(/"/g, '""')}"`);
        }

        // Langkah D: Gabungkan menjadi valid CSV line
        row.push(`"${(r.topikLemah || "").replace(/"/g, '""')}"`);
        row.push(`"${(r.feedback || "").replace(/"/g, '""')}"`);

        return row.join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Rekap_Nilai_CogniEdu.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
