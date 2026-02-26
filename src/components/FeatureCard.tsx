import React from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

export type ColorTheme = 'emerald' | 'teal' | 'indigo' | 'orange' | 'rose';

interface FeatureCardProps {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    colorTheme: ColorTheme;
}

export default function FeatureCard({ href, title, description, icon: Icon, colorTheme }: FeatureCardProps) {
    const themeStyles = {
        emerald: {
            hoverShadow: 'hover:shadow-emerald-500/10',
            bgLight: 'bg-emerald-50',
            bgHover: 'group-hover:bg-emerald-100/50',
            iconBg: 'bg-emerald-100',
            text: 'text-emerald-600',
            groupHoverText: 'group-hover:text-emerald-600',
        },
        teal: {
            hoverShadow: 'hover:shadow-teal-500/10',
            bgLight: 'bg-teal-50',
            bgHover: 'group-hover:bg-teal-100/50',
            iconBg: 'bg-teal-100',
            text: 'text-teal-600',
            groupHoverText: 'group-hover:text-teal-600',
        },
        indigo: {
            hoverShadow: 'hover:shadow-indigo-500/10',
            bgLight: 'bg-indigo-50',
            bgHover: 'group-hover:bg-indigo-100/50',
            iconBg: 'bg-indigo-100',
            text: 'text-indigo-600',
            groupHoverText: 'group-hover:text-indigo-600',
        },
        orange: {
            hoverShadow: 'hover:shadow-orange-500/10',
            bgLight: 'bg-orange-50',
            bgHover: 'group-hover:bg-orange-100/50',
            iconBg: 'bg-orange-100',
            text: 'text-orange-600',
            groupHoverText: 'group-hover:text-orange-600',
        },
        rose: {
            hoverShadow: 'hover:shadow-rose-500/10',
            bgLight: 'bg-rose-50',
            bgHover: 'group-hover:bg-rose-100/50',
            iconBg: 'bg-rose-100',
            text: 'text-rose-600',
            groupHoverText: 'group-hover:text-rose-600',
        },
    };

    const t = themeStyles[colorTheme];

    return (
        <Link href={href} className="group">
            <div className={`h-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl ${t.hoverShadow} hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${t.bgLight} rounded-bl-full -z-10 ${t.bgHover} transition-colors`} />
                <div className={`w-14 h-14 ${t.iconBg} ${t.text} rounded-xl flex items-center justify-center mb-6 shadow-sm`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h2 className={`text-xl font-bold text-slate-900 mb-3 ${t.groupHoverText} transition-colors`}>{title}</h2>
                <p className="text-slate-600 leading-relaxed text-sm mb-6 flex-1">
                    {description}
                </p>
                <div className={`flex items-center text-sm font-semibold ${t.text} gap-2 mt-auto`}>
                    Buka Fitur <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
