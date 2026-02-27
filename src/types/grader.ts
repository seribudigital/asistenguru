export interface MasterKeyItem {
    nomor: number;
    kunci: string;
    topik: string;
    bobot: number;
}

export interface StudentAnswerItem {
    nomor: number;
    jawaban: string;
    benar: boolean;
}

export interface ClassResult {
    nama: string;
    nilaiAkhir: number;
    pgBenar: number;
    esaiBenar: number;
    tambahan: number;
    rincianPG: Record<string, string>;
    rincianEsai: Record<string, number>;
    topikLemah: string;
    feedback: string;
    jawabanDetail: StudentAnswerItem[];
}
