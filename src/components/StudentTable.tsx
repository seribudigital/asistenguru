import React from "react";
import { Trash2 } from "lucide-react";
import { ClassResult, MasterKeyItem } from "@/types/grader";

interface StudentTableProps {
    classResults: ClassResult[];
    masterKey: MasterKeyItem[];
    removeStudent: (index: number) => void;
}

export default function StudentTable({ classResults, masterKey, removeStudent }: StudentTableProps) {
    if (classResults.length === 0 || masterKey.length === 0) {
        return null;
    }

    // Hitung persentase benar per nomor
    const totalSiswa = classResults.length;
    const persentaseBenar = masterKey.map((mk) => {
        const jumlahBenar = classResults.reduce((acc, result) => {
            const answerDetail = result.jawabanDetail?.find((jd) => jd.nomor === mk.nomor);
            if (answerDetail && answerDetail.benar) {
                return acc + 1;
            }
            return acc;
        }, 0);
        return totalSiswa > 0 ? Math.round((jumlahBenar / totalSiswa) * 100) : 0;
    });

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        {/* Baris 1: Kunci Jawaban */}
                        <tr>
                            <th className="px-4 py-3 font-semibold text-slate-600 bg-white sticky left-0 z-10 border-r border-slate-200 w-12" rowSpan={3}>No</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 bg-white sticky left-12 z-10 border-r border-slate-200 w-48" rowSpan={3}>Nama Siswa</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 bg-slate-100 text-center w-24">Kunci Jawaban</th>
                            {masterKey.map((mk, idx) => (
                                <th key={`kunci-${idx}`} className="px-2 py-3 font-bold text-slate-800 text-center bg-slate-100 border-l border-slate-200 min-w-[3rem]">
                                    {mk.nomor}. {mk.kunci}
                                </th>
                            ))}
                            <th className="px-4 py-3 font-semibold text-slate-600 bg-white sticky right-0 z-10 border-l border-slate-200" rowSpan={3}>Aksi</th>
                        </tr>

                        {/* Baris 2: Inti Bahasan */}
                        <tr>
                            <th className="px-4 py-2 font-medium text-slate-500 text-center text-xs bg-slate-50 border-t border-slate-200">Inti Bahasan</th>
                            {masterKey.map((mk, idx) => (
                                <th key={`topik-${idx}`} className="px-2 py-2 font-normal text-slate-500 text-center text-xs bg-slate-50 border-t border-l border-slate-200">
                                    <div className="truncate w-full max-w-[5rem] mx-auto" title={mk.topik}>{mk.topik}</div>
                                </th>
                            ))}
                        </tr>

                        {/* Baris 3: Bobot */}
                        <tr>
                            <th className="px-4 py-2 font-medium text-slate-500 text-center text-xs bg-slate-50 border-t border-slate-200">Bobot</th>
                            {masterKey.map((mk, idx) => (
                                <th key={`bobot-${idx}`} className="px-2 py-2 font-medium text-slate-600 text-center text-xs bg-slate-50 border-t border-l border-slate-200">
                                    {mk.bobot}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Baris Siswa */}
                        {classResults.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-3 text-slate-500 font-medium bg-white group-hover:bg-slate-50/50 sticky left-0 z-10 border-r border-slate-200">{i + 1}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 bg-white group-hover:bg-slate-50/50 sticky left-12 z-10 border-r border-slate-200 flex flex-col justify-center">
                                    <span>{r.nama}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Nilai: <strong className={r.nilaiAkhir >= 75 ? "text-emerald-600" : "text-rose-600"}>{r.nilaiAkhir}</strong></span>
                                </td>
                                <td className="px-4 py-3 text-center text-xs text-slate-500 font-medium bg-white group-hover:bg-slate-50/50 border-r border-slate-200">
                                    Jawaban
                                </td>
                                {masterKey.map((mk, idx) => {
                                    const answerDetail = r.jawabanDetail?.find((jd) => jd.nomor === mk.nomor);
                                    let content = "-";
                                    let bgColor = "bg-slate-50";
                                    let textColor = "text-slate-500";

                                    if (answerDetail) {
                                        content = answerDetail.jawaban;
                                        if (answerDetail.benar) {
                                            bgColor = "bg-emerald-50";
                                            textColor = "text-emerald-700 font-bold";
                                        } else {
                                            bgColor = "bg-rose-100";
                                            textColor = "text-rose-700 font-bold";
                                        }
                                    }

                                    return (
                                        <td key={`ans-${i}-${idx}`} className={`px-2 py-3 text-center border-l border-slate-100`}>
                                            <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center text-sm ${bgColor} ${textColor} border ${answerDetail?.benar ? 'border-emerald-200' : (answerDetail ? 'border-rose-300' : 'border-slate-200')}`}>
                                                {content}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-center bg-white group-hover:bg-slate-50/50 sticky right-0 z-10 border-l border-slate-200">
                                    <button
                                        onClick={() => removeStudent(i)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-1 rounded-md shadow-sm border border-slate-200 hover:border-rose-200 group-hover:bg-rose-50"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-300">
                        <tr>
                            <td className="px-4 py-3 font-semibold text-slate-700 bg-slate-100 sticky left-0 z-10 border-r border-slate-300" colSpan={2}>
                                Analisis Butir Soal
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600 text-center text-xs border-r border-slate-200">
                                % Benar
                            </td>
                            {persentaseBenar.map((pct, idx) => (
                                <td key={`pct-${idx}`} className="px-2 py-3 text-center border-l border-slate-200">
                                    <div className={`text-xs font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                        {pct}%
                                    </div>
                                </td>
                            ))}
                            <td className="px-4 py-3 bg-slate-50 sticky right-0 z-10 border-l border-slate-200"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Summary footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold">{classResults.length}</span> siswa terkoreksi
                </p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Benar
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></div> Salah
                    </span>
                </div>
            </div>
        </div>
    );
}
