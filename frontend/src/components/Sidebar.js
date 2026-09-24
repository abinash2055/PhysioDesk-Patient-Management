"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Activity,
    CalendarDays,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Users,
    UserRoundCog,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import "./sidebar.css";

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
        icon: CreditCard,
    },
    {
        name: "Therapists",
        href: "/therapists",
        icon: UserRoundCog,
        adminOnly: true,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <Activity size={21} />
                </div>

                <div>
                    <h1>PhysioDesk</h1>
                    <span>Clinic Management</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-label">
                    Workspace
                </span>

                {navigation
                    .filter(
                        (item) =>
                            !item.adminOnly ||
                            user?.role === "ADMIN"
                    )
                    .map((item) => {
                        const Icon = item.icon;

                        const active =
                            pathname === item.href ||
                            (
                                item.href !== "/" &&
                                pathname.startsWith(
                                    item.href
                                )
                            );

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={
                                    active
                                        ? "sidebar-link active"
                                        : "sidebar-link"
                                }
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.email
                            ?.charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <strong>
                            {user?.role === "ADMIN"
                                ? "Administrator"
                                : "Staff"}
                        </strong>

                        <span>
                            {user?.email}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="logout-button"
                    onClick={logout}
                >
                    <LogOut size={17} />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
}