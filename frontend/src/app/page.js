import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
            Overview
          </p>

          <h1 className="text-4xl font-semibold text-[var(--text-primary)]">
            Dashboard
          </h1>

          <p className="mt-2 text-[var(--text-secondary)]">
            Welcome back to PhysioDesk.
          </p>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Getting started
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Your clinic dashboard will appear here.
          </p>
        </div>
      </div>
    </AppShell>
  );
}