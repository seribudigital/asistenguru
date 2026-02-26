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
}
