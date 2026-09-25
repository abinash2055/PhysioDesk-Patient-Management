"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import "./schedule.css"

const START_HOUR = 8;
const END_HOUR = 20;

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function timeToMinutes(value) {
  if (!value) return 0;

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTime(value) {
  if (!value) return "";

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function getDayOfWeek(date) {
  // JS: Sunday = 0, Monday = 1...
  // Backend: Monday = 0, Sunday = 6
  return (date.getDay() + 6) % 7;
}

function isSameDay(dateA, dateB) {
  return formatDateForApi(dateA) === formatDateForApi(dateB);
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [schedules, setSchedules] = useState({});
  const [overrides, setOverrides] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [form, setForm] = useState({
    patient_id: "",
    therapist_id: "",
    appointment_date: formatDateForApi(getToday()),
    start_time: "09:00",
    payment_method: "",
    session_type: "Physiotherapy Session",
    notes: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");

  const selectedDateString = formatDateForApi(selectedDate);
  const selectedDayOfWeek = getDayOfWeek(selectedDate);

  async function loadBaseData() {
    try {
      setError("");

      const [therapistsResponse, patientsResponse] = await Promise.all([
        api.get("/api/therapists"),
        api.get("/api/patients", {
          params: {
            status: "Active",
          },
        }),
      ]);

      setTherapists(
        Array.isArray(therapistsResponse.data)
          ? therapistsResponse.data.filter((therapist) => therapist.is_active)
          : [],
      );

      setPatients(
        Array.isArray(patientsResponse.data)
          ? patientsResponse.data.filter(
              (patient) => patient.status === "Active",
            )
          : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load therapists and patients.",
      );
    }
  }

  async function loadScheduleData() {
    try {
      setLoading(true);
      setError("");

      const appointmentsResponse = await api.get("/api/appointments", {
        params: {
          appointment_date: selectedDateString,
        },
      });

      setAppointments(
        Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : [],
      );

      const therapistSchedules = {};
      const therapistOverrides = {};

      await Promise.all(
        therapists.map(async (therapist) => {
          const [scheduleResponse, overrideResponse] = await Promise.all([
            api.get(`/api/therapists/${therapist.id}/schedule`),
            api.get(`/api/therapists/${therapist.id}/schedule-overrides`),
          ]);

          therapistSchedules[therapist.id] = Array.isArray(
            scheduleResponse.data,
          )
            ? scheduleResponse.data
            : [];

          therapistOverrides[therapist.id] = Array.isArray(
            overrideResponse.data,
          )
            ? overrideResponse.data
            : [];
        }),
      );

      setSchedules(therapistSchedules);
      setOverrides(therapistOverrides);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail || "Unable to load schedule.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function reloadAppointments() {
    try {
      const response = await api.get("/api/appointments", {
        params: {
          appointment_date: selectedDateString,
        },
      });

      setAppointments(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail || "Unable to refresh appointments.",
      );
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (therapists.length > 0) {
      loadScheduleData();
    } else {
      setLoading(false);
    }
  }, [selectedDateString, therapists.length]);

  const timeSlots = useMemo(() => {
    const slots = [];

    for (
      let minutes = START_HOUR * 60;
      minutes < END_HOUR * 60;
      minutes += 30
    ) {
      slots.push(minutesToTime(minutes));
    }

    return slots;
  }, []);

  const filteredTherapists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return therapists.filter((therapist) => {
      const schedule = getTherapistSchedule(therapist.id);
      const isDayOff = !schedule;

      const matchesSearch =
        !query ||
        therapist.name.toLowerCase().includes(query) ||
        (therapist.specialty || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && therapist.is_active) ||
        (statusFilter === "Day off" && isDayOff);

      let matchesTime = true;

      if (timeFilter !== "All" && schedule) {
        const startMinutes = timeToMinutes(schedule.start_time);
        const endMinutes = timeToMinutes(schedule.end_time);

        if (timeFilter === "Morning" && !(startMinutes < 12 * 60)) {
          matchesTime = false;
        }

        if (timeFilter === "Afternoon" && !(startMinutes >= 12 * 60 && startMinutes < 17 * 60)) {
          matchesTime = false;
        }

        if (timeFilter === "Evening" && !(startMinutes >= 17 * 60)) {
          matchesTime = false;
        }
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [therapists, schedules, overrides, selectedDateString, selectedDayOfWeek, search, statusFilter, timeFilter]);

  function getTherapistSchedule(therapistId) {
    const weeklySchedule = schedules[therapistId] || [];
    const therapistOverrides = overrides[therapistId] || [];

    const override = therapistOverrides.find(
      (item) => item.override_date === selectedDateString,
    );

    if (override) {
      if (override.is_day_off) {
        return null;
      }

      if (override.start_time && override.end_time) {
        return {
          start_time: override.start_time,
          end_time: override.end_time,
          slot_duration: override.slot_duration || 30,
        };
      }
    }

    return (
      weeklySchedule.find(
        (schedule) => schedule.day_of_week === selectedDayOfWeek,
      ) || null
    );
  }

  function getAppointment(therapistId, time) {
    const slotStart = timeToMinutes(time);

    return appointments.find((appointment) => {
      if (
        appointment.therapist_id !== therapistId ||
        appointment.status === "Cancelled"
      ) {
        return false;
      }

      const appointmentStart = timeToMinutes(appointment.start_time);
      const appointmentEnd = timeToMinutes(appointment.end_time);

      return slotStart >= appointmentStart && slotStart < appointmentEnd;
    });
  }

  function isSlotInsideSchedule(therapistId, time) {
    const schedule = getTherapistSchedule(therapistId);

    if (!schedule) return false;

    const slotStart = timeToMinutes(time);
    const scheduleStart = timeToMinutes(schedule.start_time);
    const scheduleEnd = timeToMinutes(schedule.end_time);

    return slotStart >= scheduleStart && slotStart < scheduleEnd;
  }

  function getPatientName(patientId) {
    return (
      patients.find((patient) => patient.id === patientId)?.name ||
      `Patient #${patientId}`
    );
  }

  function getTherapistName(therapistId) {
    return (
      therapists.find((therapist) => therapist.id === therapistId)?.name ||
      `Therapist #${therapistId}`
    );
  }

  function changeDate(days) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  }

  function openCreateModal(therapistId, startTime = "09:00") {
    setEditingAppointment(null);

    setForm({
      patient_id: "",
      therapist_id: String(therapistId || ""),
      appointment_date: selectedDateString,
      start_time: startTime,
      payment_method: "",
      session_type: "Physiotherapy Session",
      notes: "",
    });

    setError("");
    setShowBookingModal(true);
  }

  function openEditModal(appointment) {
    setEditingAppointment(appointment);

    setForm({
      patient_id: String(appointment.patient_id),
      therapist_id: String(appointment.therapist_id),
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time.slice(0, 5),
      payment_method: appointment.payment_method || "",
      session_type: appointment.session_type || "",
      notes: appointment.notes || "",
    });

    setError("");
    setShowBookingModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowBookingModal(false);
    setEditingAppointment(null);
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveAppointment(event) {
    event.preventDefault();

    if (!form.patient_id || !form.therapist_id) {
      setError("Please select both a patient and therapist.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        patient_id: Number(form.patient_id),
        therapist_id: Number(form.therapist_id),
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        payment_method: form.payment_method || null,
        session_type: form.session_type || null,
        notes: form.notes || null,
      };

      if (editingAppointment) {
        await api.put(
          `/api/appointments/${editingAppointment.id}`,
          payload,
        );
      } else {
        await api.post("/api/appointments", payload);
      }

      setShowBookingModal(false);
      setEditingAppointment(null);

      await reloadAppointments();
    } catch (err) {
      console.error(err);

      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail.map((item) => item.msg || "Invalid request").join(", "),
        );
      } else {
        setError(detail || "Unable to save appointment.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(appointment) {
    const confirmed = window.confirm(
      `Cancel the appointment for ${getPatientName(
        appointment.patient_id,
      )}?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.patch(`/api/appointments/${appointment.id}/cancel`);

      await reloadAppointments();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to cancel appointment.",
      );
    }
  }

  async function completeAppointment(appointment) {
    try {
      setError("");

      await api.patch(
        `/api/appointments/${appointment.id}/complete`,
      );

      await reloadAppointments();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to complete appointment.",
      );
    }
  }

  function goToToday() {
    setSelectedDate(getToday());
  }

  return (
    <AppShell>
      <div className="schedule-page">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Clinic operations</p>
            <h1>Schedule</h1>
            <p className="page-subtitle">
              Manage therapist availability and patient appointments.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => openCreateModal()}
          >
            <Plus size={18} />
            Book appointment
          </button>
        </div>

        <div className="schedule-toolbar">
          <div className="schedule-date-controls">
            <button
              className="icon-button"
              onClick={() => changeDate(-1)}
              title="Previous day"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              className="secondary-button today-button"
              onClick={goToToday}
            >
              Today
            </button>

            <button
              className="icon-button"
              onClick={() => changeDate(1)}
              title="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="schedule-current-date">
            <CalendarDays size={18} />
            <strong>{formatDisplayDate(selectedDate)}</strong>
          </div>

          <button
            className="secondary-button"
            onClick={loadScheduleData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="schedule-search-card">
          <div className="schedule-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search therapist or specialty..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="schedule-status-filters">
            {["All", "Active", "Day off"].map((status) => (
              <button
                key={status}
                className={
                  statusFilter === status
                    ? "schedule-filter active"
                    : "schedule-filter"
                }
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="schedule-time-filters">
            {["All", "Morning", "Afternoon", "Evening"].map((slot) => (
              <button
                key={slot}
                className={
                  timeFilter === slot
                    ? "schedule-filter active"
                    : "schedule-filter"
                }
                onClick={() => setTimeFilter(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="schedule-error">
            <span>{error}</span>
            <button
              className="icon-button small"
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="schedule-summary">
          <div className="schedule-summary-card">
            <span>Appointments</span>
            <strong>{appointments.length}</strong>
          </div>

          <div className="schedule-summary-card">
            <span>Active therapists</span>
            <strong>{therapists.length}</strong>
          </div>

          <div className="schedule-summary-card">
            <span>Booked</span>
            <strong>
              {
                appointments.filter(
                  (appointment) => appointment.status === "Booked",
                ).length
              }
            </strong>
          </div>

          <div className="schedule-summary-card">
            <span>Completed</span>
            <strong>
              {
                appointments.filter(
                  (appointment) => appointment.status === "Completed",
                ).length
              }
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="schedule-loading">
            <Clock3 size={22} />
            Loading schedule...
          </div>
        ) : filteredTherapists.length === 0 ? (
          <div className="empty-state schedule-empty">
            <CalendarDays size={28} />
            <h3>No therapists match your filters</h3>
            <p>
              Adjust your search or clear the filters to see the full schedule.
            </p>
          </div>
        ) : (
          <div className="schedule-card">
            <div className="schedule-grid">
              {(() => {
                const therapistRows = [];
                const chunkSize = 4;

                for (let i = 0; i < filteredTherapists.length; i += chunkSize) {
                  therapistRows.push(filteredTherapists.slice(i, i + chunkSize));
                }

                return therapistRows.map((rowTherapists, rowIndex) => (
                  <div className="schedule-row" key={rowIndex}>
                    <div className="schedule-time-column">
                      {rowIndex === 0 ? (
                        <div className="schedule-corner">Time</div>
                      ) : (
                        <div className="schedule-corner" />
                      )}

                      {timeSlots.map((time) => (
                        <div
                          className="schedule-time-cell"
                          key={time}
                        >
                          {formatTime(time)}
                        </div>
                      ))}
                    </div>

                    {Array.from({ length: 4 }).map((_, index) => {
                      const therapist = rowTherapists[index];

                      if (!therapist) {
                        return (
                          <div
                            className="therapist-column"
                            key={`empty-${rowIndex}-${index}`}
                          />
                        );
                      }

                      const schedule = getTherapistSchedule(therapist.id);
                      const isDayOff = !schedule;

                      return (
                        <div
                          className="therapist-column"
                          key={therapist.id}
                        >
                          <div className="therapist-column-header">
                            <strong>{therapist.name}</strong>
                            <span>{therapist.specialty}</span>

                            {isDayOff ? (
                              <span className="schedule-day-off-badge">
                                Day off
                              </span>
                            ) : (
                              <span className="schedule-hours">
                                {formatTime(schedule.start_time)} –{" "}
                                {formatTime(schedule.end_time)}
                              </span>
                            )}
                          </div>

                          {timeSlots.map((time) => {
                            const appointment = getAppointment(
                              therapist.id,
                              time,
                            );

                            const insideSchedule =
                              isSlotInsideSchedule(therapist.id, time);

                            if (appointment) {
                              return (
                                <div
                                  className={`schedule-slot appointment-slot status-${appointment.status
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                  key={`${therapist.id}-${time}`}
                                >
                                  <button
                                    className="appointment-content"
                                    onClick={() =>
                                      openEditModal(appointment)
                                    }
                                  >
                                    <strong>
                                      {getPatientName(
                                        appointment.patient_id,
                                      )}
                                    </strong>

                                    <span>
                                      {formatTime(appointment.start_time)}{" "}
                                      –{" "}
                                      {formatTime(appointment.end_time)}
                                    </span>

                                    <small>
                                      {appointment.session_type ||
                                        "Physiotherapy Session"}
                                    </small>
                                  </button>

                                  <div className="appointment-actions">
                                    {appointment.status === "Booked" && (
                                      <button
                                        className="appointment-action-button"
                                        title="Complete"
                                        onClick={() =>
                                          completeAppointment(
                                            appointment,
                                          )
                                        }
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}

                                    {appointment.status !== "Completed" &&
                                      appointment.status !==
                                        "Cancelled" && (
                                        <button
                                          className="appointment-action-button"
                                          title="Cancel"
                                          onClick={() =>
                                            cancelAppointment(
                                              appointment,
                                            )
                                          }
                                        >
                                          <X size={14} />
                                        </button>
                                      )}

                                    <button
                                      className="appointment-action-button"
                                      title="Edit / reschedule"
                                      onClick={() =>
                                        openEditModal(appointment)
                                      }
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            if (isDayOff) {
                              return (
                                <div
                                  className="schedule-slot day-off-slot"
                                  key={`${therapist.id}-${time}`}
                                />
                              );
                            }

                            if (!insideSchedule) {
                              return (
                                <div
                                  className="schedule-slot outside-hours-slot"
                                  key={`${therapist.id}-${time}`}
                                />
                              );
                            }

                            return (
                              <button
                                className="schedule-slot available-slot"
                                key={`${therapist.id}-${time}`}
                                onClick={() =>
                                  openCreateModal(
                                    therapist.id,
                                    time,
                                  )
                                }
                                title={`Book ${formatTime(time)}`}
                              >
                                <Plus size={14} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <div className="schedule-legend">
          <span>
            <i className="legend-dot available" />
            Available
          </span>

          <span>
            <i className="legend-dot booked" />
            Booked
          </span>

          <span>
            <i className="legend-dot completed" />
            Completed
          </span>

          <span>
            <i className="legend-dot outside" />
            Outside hours
          </span>

          <span>
            <i className="legend-dot day-off" />
            Day off
          </span>
        </div>
      </div>

      {showBookingModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal-card schedule-booking-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingAppointment
                    ? "Appointment"
                    : "New appointment"}
                </p>

                <h2>
                  {editingAppointment
                    ? "Edit appointment"
                    : "Book appointment"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="patient-form"
              onSubmit={saveAppointment}
            >
              <div className="form-grid">
                <label className="form-field">
                  <span>Patient *</span>

                  <select
                    value={form.patient_id}
                    onChange={(event) =>
                      updateForm(
                        "patient_id",
                        event.target.value,
                      )
                    }
                    required
                  >
                    <option value="">Select patient</option>

                    {patients.map((patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {patient.name} — {patient.phone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Therapist *</span>

                  <select
                    value={form.therapist_id}
                    onChange={(event) =>
                      updateForm(
                        "therapist_id",
                        event.target.value,
                      )
                    }
                    required
                  >
                    <option value="">Select therapist</option>

                    {therapists.map((therapist) => (
                      <option
                        key={therapist.id}
                        value={therapist.id}
                      >
                        {therapist.name} — {therapist.specialty}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Date *</span>

                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(event) =>
                      updateForm(
                        "appointment_date",
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Start time *</span>

                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(event) =>
                      updateForm(
                        "start_time",
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Payment method</span>

                  <select
                    value={form.payment_method}
                    onChange={(event) =>
                      updateForm(
                        "payment_method",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">Not specified</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>
                    <option value="Online">Online</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Session type</span>

                  <select
                    value={form.session_type}
                    onChange={(event) =>
                      updateForm(
                        "session_type",
                        event.target.value,
                      )
                    }
                  >
                    <option value="Physiotherapy Session">
                      Physiotherapy Session
                    </option>
                    <option value="Initial Assessment">
                      Initial Assessment
                    </option>
                    <option value="Follow-up">
                      Follow-up
                    </option>
                    <option value="Rehabilitation">
                      Rehabilitation
                    </option>
                    <option value="Manual Therapy">
                      Manual Therapy
                    </option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Notes</span>

                  <textarea
                    rows="4"
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder="Add appointment notes..."
                  />
                </label>
              </div>

              <div className="schedule-form-help">
                <Clock3 size={15} />
                <span>
                  The appointment duration is determined by the
                  therapist&apos;s schedule.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAppointment
                      ? "Save changes"
                      : "Book appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}