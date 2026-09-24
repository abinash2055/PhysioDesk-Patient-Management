"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Users,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get(
          "/api/dashboard"
        );

        setDashboard(response.data);
      } catch (error) {
        setError(
          error.response?.data?.detail ||
            "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboard();
    }
  }, [user]);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Clinic overview
          </p>

          <h1>Dashboard</h1>

          <p>
            Welcome back. Here&apos;s what&apos;s
            happening today.
          </p>
        </div>
      </div>

      {loading && (
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {dashboard && (
        <>
          <section className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={20} />
              </div>

              <div>
                <span>
                  Patients seen today
                </span>

                <strong>
                  {
                    dashboard.stats
                      .patients_seen_today
                  }
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CalendarDays size={20} />
              </div>

              <div>
                <span>
                  Therapists on duty
                </span>

                <strong>
                  {
                    dashboard.stats
                      .therapists_on_duty_today
                  }
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CircleDollarSign size={20} />
              </div>

              <div>
                <span>
                  Revenue collected
                </span>

                <strong>
                  NPR{" "}
                  {Number(
                    dashboard.stats
                      .revenue_collected_today
                  ).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock3 size={20} />
              </div>

              <div>
                <span>
                  Open slots
                </span>

                <strong>
                  {
                    dashboard.stats
                      .open_slots_today
                  }
                </strong>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>
                  Therapist capacity
                </h2>

                <p>
                  Today&apos;s appointment capacity
                </p>
              </div>
            </div>

            <div className="data-card">
              {dashboard.therapist_capacity
                .length === 0 ? (
                <div className="empty-state">
                  No therapists are scheduled
                  today.
                </div>
              ) : (
                <div className="capacity-list">
                  {dashboard.therapist_capacity.map(
                    (therapist) => (
                      <div
                        className="capacity-row"
                        key={
                          therapist.therapist_id
                        }
                      >
                        <div>
                          <strong>
                            {
                              therapist.therapist_name
                            }
                          </strong>

                          <span>
                            {
                              therapist.specialty
                            }
                          </span>
                        </div>

                        <div className="capacity-numbers">
                          <span>
                            {
                              therapist.booked_slots
                            }{" "}
                            booked
                          </span>

                          <span>
                            {
                              therapist.open_slots
                            }{" "}
                            open
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>
                  Recent patients
                </h2>

                <p>
                  Recently added patients
                </p>
              </div>
            </div>

            <div className="data-card">
              {dashboard.recent_patients
                .length === 0 ? (
                <div className="empty-state">
                  No patients found.
                </div>
              ) : (
                <div className="patient-list">
                  {dashboard.recent_patients.map(
                    (patient) => (
                      <div
                        className="patient-row"
                        key={patient.id}
                      >
                        <div>
                          <strong>
                            {patient.name}
                          </strong>

                          <span>
                            {patient.condition}
                          </span>
                        </div>

                        <span className="status-pill">
                          {patient.status}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}