"use client";

import Sidebar from "./Sidebar";
import ProtectedRoute from "./ProtectedRoute";

export default function AppShell({
  children,
}) {
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}