"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, Receipt, Stethoscope } from "lucide-react";

const navigation = [
    {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Patients",
        href: "/patients",
        icon: Users,
    },
    {
        name: "Schedule",
        href: "/schedule",
        icon: CalendarDays,
    },
    {
        name: "Billing",
        href: "/billing",
        icon: Receipt,
    },
    {
        name: "Therapists",
        href: "/therapists",
        icon: Stethoscope,
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-[var(--secondary)] text-white">
            <div className="border-b border-white/10 px-6 py-6">
                <h1 className="font-[var(--font-fraunces)] text-2xl font-semibold">
                    PhysioDesk
                </h1>

                <p className="mt-1 text-sm text-white/50">
                    Clinic Management
                </p>
            </div>

            <nav className="flex-1 px-3 py-5">
                <div className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                                        ? "bg-[var(--primary)] text-white"
                                        : "text-white/70 hover:bg-[var(--secondary-light)] hover:text-white"
                                    }`}
                            >
                                <Icon size={19} strokeWidth={1.8} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="border-t border-white/10 px-6 py-5">
                <p className="text-xs text-white/40">
                    PhysioDesk
                </p>
                <p className="mt-1 text-sm text-white/70">
                    Clinic Management
                </p>
            </div>
        </aside>
    );
}