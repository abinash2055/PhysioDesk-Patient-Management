"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  UserRound,
  Users,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import "./dashboard.css"


function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "-";

  const [hours, minutes] = value.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getNetInvoiceAmount(invoice) {
  return Math.max(
    Number(invoice.amount || 0) -
    Number(invoice.discount || 0),
    0,
  );
}

function statusClass(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `dashboard-status ${normalized}`;
}

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getToday();

  const [therapistSchedules, setTherapistSchedules] = useState({});

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        patientsResponse,
        therapistsResponse,
        appointmentsResponse,
        invoicesResponse,
      ] = await Promise.all([
        api.get("/api/patients"),
        api.get("/api/therapists"),
        api.get("/api/appointments", {
          params: {
            appointment_date: today,
          },
        }),
        api.get("/api/invoices"),
      ]);

      const loadedPatients = Array.isArray(
        patientsResponse.data,
      )
        ? patientsResponse.data
        : [];

      const loadedTherapists = Array.isArray(
        therapistsResponse.data,
      )
        ? therapistsResponse.data
        : [];

      setPatients(loadedPatients);
      setTherapists(loadedTherapists);

      setAppointments(
        Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : [],
      );

      setInvoices(
        Array.isArray(invoicesResponse.data)
          ? invoicesResponse.data
          : [],
      );

      const jsDay = new Date(
        `${today}T00:00:00`,
      ).getDay();

      // Convert JavaScript Sunday=0 to backend Monday=0.
      const backendDay =
        jsDay === 0 ? 6 : jsDay - 1;

      const scheduleResults =
        await Promise.all(
          loadedTherapists
            .filter(
              (therapist) =>
                therapist.is_active !== false,
            )
            .map(async (therapist) => {
              try {
                const response = await api.get(
                  `/api/therapists/${therapist.id}/schedule`,
                );

                const schedules = Array.isArray(
                  response.data,
                )
                  ? response.data
                  : [];

                const todaySchedule =
                  schedules.find(
                    (schedule) =>
                      schedule.day_of_week ===
                      backendDay,
                  );

                return [
                  therapist.id,
                  todaySchedule || null,
                ];
              } catch {
                return [therapist.id, null];
              }
            }),
        );

      setTherapistSchedules(
        Object.fromEntries(scheduleResults),
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
        "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const activePatients = useMemo(
    () =>
      patients.filter(
        (patient) => patient.status === "Active",
      ),
    [patients],
  );

  const activeTherapists = useMemo(
    () =>
      therapists.filter(
        (therapist) => therapist.is_active !== false,
      ),
    [therapists],
  );

  const completedToday = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "Completed",
      ),
    [appointments],
  );

  const revenueToday = useMemo(() => {
    return invoices
      .filter(
        (invoice) =>
          invoice.status === "Paid" &&
          invoice.invoice_date === today,
      )
      .reduce(
        (total, invoice) =>
          total + getNetInvoiceAmount(invoice),
        0,
      );
  }, [invoices, today]);

  const dueAmount = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status === "Due")
      .reduce(
        (total, invoice) =>
          total + getNetInvoiceAmount(invoice),
        0,
      );
  }, [invoices]);

  const therapistCapacity = useMemo(() => {
    return activeTherapists.map((therapist) => {
      const schedule =
        therapistSchedules[therapist.id];

      const appointmentCount =
        appointments.filter(
          (appointment) =>
            appointment.therapist_id === therapist.id &&
            appointment.status !== "Cancelled",
        ).length;

      let capacity = 0;

      if (schedule) {
        const [startHour, startMinute] =
          schedule.start_time
            .split(":")
            .map(Number);

        const [endHour, endMinute] =
          schedule.end_time
            .split(":")
            .map(Number);

        const totalMinutes =
          endHour * 60 +
          endMinute -
          (startHour * 60 + startMinute);

        const slotDuration =
          Number(schedule.slot_duration) || 30;

        if (totalMinutes > 0) {
          capacity = Math.floor(
            totalMinutes / slotDuration,
          );
        }
      }

      return {
        therapist,
        appointmentCount,
        capacity,
        openSlots: Math.max(
          capacity - appointmentCount,
          0,
        ),
      };
    });
  }, [
    activeTherapists,
    appointments,
    therapistSchedules,
  ]);
  const openSlots = useMemo(() => {
    return null;
  }, []);

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => {
        return (
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
        );
      })
      .slice(0, 5);
  }, [patients]);

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .filter(
        (appointment) =>
          appointment.status !== "Cancelled" &&
          appointment.status !== "Completed",
      )
      .sort((a, b) =>
        String(a.start_time).localeCompare(
          String(b.start_time),
        ),
      )
      .slice(0, 6);
  }, [appointments]);

  function getPatientName(patientId) {
    return (
      patients.find(
        (patient) => patient.id === patientId,
      )?.name || `Patient #${patientId}`
    );
  }

  function getTherapistName(therapistId) {
    return (
      therapists.find(
        (therapist) => therapist.id === therapistId,
      )?.name || `Therapist #${therapistId}`
    );
  }

  return (
    <AppShell>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Clinic overview</p>

            <h1>Dashboard</h1>

            <p className="page-subtitle">
              Here&apos;s what&apos;s happening at the clinic today.
            </p>
          </div>

          <div className="dashboard-date">
            <CalendarDays size={16} />
            <span>{formatDate(today)}</span>
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            <span>{error}</span>

            <button
              className="secondary-button"
              onClick={loadDashboard}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            <Activity size={24} />
            <span>Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* Statistics */}

            <div className="dashboard-stats">
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <Users size={20} />
                </div>

                <div>
                  <span>Patients seen today</span>
                  <strong>
                    {completedToday.length}
                  </strong>

                  <small>
                    {activePatients.length} active patients
                  </small>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon green">
                  <UserRound size={20} />
                </div>

                <div>
                  <span>Therapists on duty</span>
                  <strong>
                    {activeTherapists.length}
                  </strong>

                  <small>
                    Active therapists
                  </small>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon gold">
                  <DollarSign size={20} />
                </div>

                <div>
                  <span>Revenue collected today</span>
                  <strong className="mono-value">
                    {formatCurrency(revenueToday)}
                  </strong>

                  <small>
                    Outstanding:{" "}
                    {formatCurrency(dueAmount)}
                  </small>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon neutral">
                  <Clock3 size={20} />
                </div>

                <div>
                  <span>Appointments today</span>
                  <strong>
                    {appointments.length}
                  </strong>

                  <small>
                    {appointments.filter(
                      (appointment) =>
                        appointment.status === "Booked",
                    ).length}{" "}
                    booked
                  </small>
                </div>
              </div>
            </div>

            {/* Main content */}

            <div className="dashboard-main-grid">
              {/* Today's appointments */}

              <section className="dashboard-card dashboard-appointments">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Today&apos;s schedule</h2>

                    <p>
                      Appointments scheduled for today
                    </p>
                  </div>

                  <a
                    href="/schedule"
                    className="dashboard-link"
                  >
                    View schedule
                  </a>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <div className="dashboard-empty">
                    <CalendarDays size={25} />

                    <h3>No upcoming appointments</h3>

                    <p>
                      There are no active appointments
                      remaining today.
                    </p>
                  </div>
                ) : (
                  <div className="dashboard-appointment-list">
                    {upcomingAppointments.map(
                      (appointment) => (
                        <div
                          className="dashboard-appointment-row"
                          key={appointment.id}
                        >
                          <div className="appointment-time">
                            <strong>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                appointment.end_time,
                              )}
                            </span>
                          </div>

                          <div className="appointment-person">
                            <strong>
                              {getPatientName(
                                appointment.patient_id,
                              )}
                            </strong>

                            <span>
                              {getTherapistName(
                                appointment.therapist_id,
                              )}
                            </span>
                          </div>

                          <span
                            className={statusClass(
                              appointment.status,
                            )}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* Therapist capacity */}

              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Therapist capacity</h2>

                    <p>
                      Today&apos;s appointment load
                    </p>
                  </div>
                </div>

                <div className="capacity-list">
                  {activeTherapists.length === 0 ? (
                    <div className="dashboard-empty compact">
                      <UserRound size={22} />
                      <p>No active therapists.</p>
                    </div>
                  ) : (
                    therapistCapacity.map(
                      ({
                        therapist,
                        appointmentCount,
                        capacity,
                        openSlots,
                      }) => {
                        const percentage = 
                        capacity > 0 
                        ? Math.min(
                          (appointmentCount / capacity) * 100,
                          100,
                        )
                        : 0;

                        return (
                          <div
                            className="capacity-item"
                            key={therapist.id}
                          >
                            <div className="capacity-heading">
                              <div>
                                <strong>
                                  {therapist.name}
                                </strong>

                                <span>
                                  {therapist.specialty}
                                </span>
                              </div>

                              <b>
                                {appointmentCount}/{capacity}
                              </b>
                            </div>

                            <div className="capacity-track">
                              <div
                                className="capacity-fill"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>

                            <span className="capacity-open">
                              { capacity === 0
                              ? "Not scheduled today"
                              : `${openSlots} open slot${
                                openSlots === 1 ? "" : "s"
                              }`}
                            </span>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </section>
            </div>

            {/* Bottom content */}

            <div className="dashboard-bottom-grid">
              {/* Recent patients */}

              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Recent patients</h2>

                    <p>
                      Recently added to the clinic
                    </p>
                  </div>

                  <a
                    href="/patients"
                    className="dashboard-link"
                  >
                    View all
                  </a>
                </div>

                {recentPatients.length === 0 ? (
                  <div className="dashboard-empty compact">
                    <Users size={22} />

                    <p>No patients found.</p>
                  </div>
                ) : (
                  <div className="recent-patient-list">
                    {recentPatients.map(
                      (patient) => (
                        <div
                          className="recent-patient-row"
                          key={patient.id}
                        >
                          <div className="patient-avatar">
                            {patient.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </div>

                          <div>
                            <strong>
                              {patient.name}
                            </strong>

                            <span>
                              {patient.condition}
                            </span>
                          </div>

                          <small>
                            {formatDate(
                              patient.created_at,
                            )}
                          </small>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* Daily overview */}

              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Daily overview</h2>

                    <p>Clinic activity summary</p>
                  </div>
                </div>

                <div className="overview-list">
                  <div className="overview-row">
                    <div className="overview-label">
                      <CheckCircle2 size={17} />
                      <span>Completed sessions</span>
                    </div>

                    <strong>
                      {completedToday.length}
                    </strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <CalendarDays size={17} />
                      <span>Total appointments</span>
                    </div>

                    <strong>
                      {appointments.length}
                    </strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <Clock3 size={17} />
                      <span>Booked appointments</span>
                    </div>

                    <strong>
                      {
                        appointments.filter(
                          (appointment) =>
                            appointment.status ===
                            "Booked",
                        ).length
                      }
                    </strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <DollarSign size={17} />
                      <span>Outstanding billing</span>
                    </div>

                    <strong className="mono-value">
                      {formatCurrency(dueAmount)}
                    </strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <Users size={17} />
                      <span>Active patients</span>
                    </div>

                    <strong>
                      {activePatients.length}
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}