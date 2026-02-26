import React from "react";
import { Trash2 } from "lucide-react";
import { ClassResult } from "@/types/grader";

interface StudentTableProps {
    classResults: ClassResult[];
    removeStudent: (index: number) => void;
}

export default function StudentTable({ classResults, removeStudent }: StudentTableProps) {
    if (classResults.length === 0) {
        return null;
    }

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-slate-600 w-12">No</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Nama Siswa</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center w-20">Nilai Akhir</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center">PG Benar</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total Esai</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Topik Terlemah</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {classResults.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{r.nama}</td>
                                <td className="px-4 py-3 text-center">
                                    <span
                                        className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-bold ${r.nilaiAkhir >= 75
                                            ? "bg-emerald-100 text-emerald-700"
                                            : r.nilaiAkhir >= 50
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-rose-100 text-rose-700"
                                            }`}
                                    >
                                        {r.nilaiAkhir}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">
                                    <span className="text-emerald-600">{r.pgBenar || 0}</span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">
                                    <span className="text-emerald-600">{r.esaiBenar || 0}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-md">
                                        {r.topikLemah}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => removeStudent(i)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold">{classResults.length}</span> siswa terkoreksi
                </p>
                <p className="text-sm text-slate-600">
                    Rata-rata:{" "}
                    <span className="font-bold text-slate-900">
                        {(
                            classResults.reduce((a, b) => a + (b.nilaiAkhir || 0), 0) /
                            (classResults.length || 1)
                        ).toFixed(1)}
                    </span>
                </p>
            </div>
        </div>
    );
}
