"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Plus,
  Save,
  UserRound,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import "./therapists.css"

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const emptyTherapistForm = {
  name: "",
  specialty: "",
};

const emptyScheduleForm = {
  day_of_week: 0,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration: 30,
};

const emptyOverrideForm = {
  override_date: "",
  is_day_off: false,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration: 30,
};

function formatTime(value) {
  if (!value) return "-";

  const [hours, minutes] = value.slice(0, 5).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDayName(day) {
  return DAYS.find((item) => item.value === Number(day))?.label || "-";
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [overrides, setOverrides] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  const [editingTherapist, setEditingTherapist] = useState(null);

  const [therapistForm, setTherapistForm] = useState(emptyTherapistForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [overrideForm, setOverrideForm] = useState(emptyOverrideForm);

  const [saving, setSaving] = useState(false);

  async function loadTherapists() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/therapists");
      setTherapists(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load therapists."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTherapistDetails(therapist) {
    try {
      setSelectedTherapist(therapist);
      setDetailLoading(true);
      setError("");

      const [scheduleResponse, overrideResponse] = await Promise.all([
        api.get(`/api/therapists/${therapist.id}/schedule`),
        api.get(`/api/therapists/${therapist.id}/overrides`),
      ]);

      setSchedules(scheduleResponse.data);
      setOverrides(overrideResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load therapist schedule."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadTherapists();
  }, []);

  const activeTherapists = useMemo(
    () => therapists.filter((therapist) => therapist.is_active),
    [therapists]
  );

  function openAddTherapist() {
    setEditingTherapist(null);
    setTherapistForm(emptyTherapistForm);
    setTherapistModalOpen(true);
  }

  function openEditTherapist(therapist) {
    setEditingTherapist(therapist);
    setTherapistForm({
      name: therapist.name,
      specialty: therapist.specialty,
    });
    setTherapistModalOpen(true);
  }

  async function saveTherapist(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingTherapist) {
        await api.put(
          `/api/therapists/${editingTherapist.id}`,
          therapistForm
        );
      } else {
        await api.post("/api/therapists", therapistForm);
      }

      setTherapistModalOpen(false);
      await loadTherapists();

      if (selectedTherapist) {
        const refreshed = therapists.find(
          (item) => item.id === selectedTherapist.id
        );

        if (refreshed) {
          await loadTherapistDetails(refreshed);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save therapist."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTherapistStatus(therapist) {
    if (
      !window.confirm(
        therapist.is_active
          ? `Deactivate ${therapist.name}?`
          : `Activate ${therapist.name}?`
      )
    ) {
      return;
    }

    try {
      setError("");

      if (therapist.is_active) {
        await api.patch(
          `/api/therapists/${therapist.id}/deactivate`
        );
      } else {
        await api.put(`/api/therapists/${therapist.id}`, {
          is_active: true,
        });
      }

      await loadTherapists();

      if (selectedTherapist?.id === therapist.id) {
        setSelectedTherapist({
          ...selectedTherapist,
          is_active: !therapist.is_active,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update therapist status."
      );
    }
  }

  function openAddSchedule() {
    setScheduleForm(emptyScheduleForm);
    setScheduleModalOpen(true);
  }

  async function saveSchedule(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post(
        `/api/therapists/${selectedTherapist.id}/schedule`,
        {
          day_of_week: Number(scheduleForm.day_of_week),
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          slot_duration: Number(scheduleForm.slot_duration),
        }
      );

      setScheduleModalOpen(false);

      await loadTherapistDetails(selectedTherapist);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save schedule."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(schedule) {
    if (!window.confirm("Remove this weekly schedule?")) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/api/therapists/${selectedTherapist.id}/schedule/${schedule.id}`
      );

      await loadTherapistDetails(selectedTherapist);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to remove schedule."
      );
    }
  }

  function openAddOverride() {
    setOverrideForm({
      ...emptyOverrideForm,
      override_date: getTodayString(),
    });

    setOverrideModalOpen(true);
  }

  async function saveOverride(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        override_date: overrideForm.override_date,
        is_day_off: overrideForm.is_day_off,
        start_time: overrideForm.is_day_off
          ? null
          : overrideForm.start_time,
        end_time: overrideForm.is_day_off
          ? null
          : overrideForm.end_time,
        slot_duration: overrideForm.is_day_off
          ? null
          : Number(overrideForm.slot_duration),
      };

      await api.post(
        `/api/therapists/${selectedTherapist.id}/overrides`,
        payload
      );

      setOverrideModalOpen(false);

      await loadTherapistDetails(selectedTherapist);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save schedule override."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOverride(override) {
    if (!window.confirm("Remove this schedule override?")) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/api/therapists/${selectedTherapist.id}/overrides/${override.id}`
      );

      await loadTherapistDetails(selectedTherapist);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to remove schedule override."
      );
    }
  }

  return (
    <AppShell>
      <div className="therapists-page">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">TEAM MANAGEMENT</p>
            <h1 className="page-title">Therapists</h1>
            <p className="page-subtitle">
              Manage therapists, working hours, and schedule overrides.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openAddTherapist}
          >
            <Plus size={17} />
            Add Therapist
          </button>
        </div>

        {error && (
          <div className="page-error">
            {error}
          </div>
        )}

        <div className="therapist-layout">
          <section className="table-card therapist-list-card">
            <div className="table-header">
              <div>
                <h2>Therapist roster</h2>
                <p>
                  {activeTherapists.length} active therapist
                  {activeTherapists.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="dashboard-loading">
                Loading therapists...
              </div>
            ) : therapists.length === 0 ? (
              <div className="empty-state">
                <UserRound size={30} />
                <h3>No therapists yet</h3>
                <p>Add your first therapist to build the roster.</p>
              </div>
            ) : (
              <div className="therapist-list">
                {therapists.map((therapist) => (
                  <button
                    type="button"
                    key={therapist.id}
                    className={`therapist-list-item ${
                      selectedTherapist?.id === therapist.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => loadTherapistDetails(therapist)}
                  >
                    <div className="therapist-avatar">
                      {therapist.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="therapist-list-content">
                      <strong>{therapist.name}</strong>
                      <span>{therapist.specialty}</span>
                    </div>

                    <span
                      className={
                        therapist.is_active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {therapist.is_active ? "Active" : "Inactive"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="therapist-detail-card">
            {!selectedTherapist ? (
              <div className="therapist-detail-empty">
                <CalendarDays size={40} />
                <h2>Select a therapist</h2>
                <p>
                  Select a therapist from the roster to view their
                  working schedule.
                </p>
              </div>
            ) : (
              <>
                <div className="therapist-detail-header">
                  <div className="therapist-detail-person">
                    <div className="therapist-avatar large">
                      {selectedTherapist.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div className="therapist-name-line">
                        <h2>{selectedTherapist.name}</h2>
                        <span
                          className={
                            selectedTherapist.is_active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {selectedTherapist.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <p>{selectedTherapist.specialty}</p>
                    </div>
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-button small"
                      onClick={() =>
                        openEditTherapist(selectedTherapist)
                      }
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="secondary-button small"
                      onClick={() =>
                        toggleTherapistStatus(selectedTherapist)
                      }
                    >
                      {selectedTherapist.is_active ? (
                        <>
                          <X size={15} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {detailLoading ? (
                  <div className="dashboard-loading">
                    Loading schedule...
                  </div>
                ) : (
                  <div className="therapist-detail-body">
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <div>
                          <h3>Weekly schedule</h3>
                          <p>
                            Regular working hours and appointment slot
                            duration.
                          </p>
                        </div>

                        {selectedTherapist.is_active && (
                          <button
                            type="button"
                            className="primary-button small"
                            onClick={openAddSchedule}
                          >
                            <Plus size={15} />
                            Add day
                          </button>
                        )}
                      </div>

                      {schedules.length === 0 ? (
                        <div className="profile-empty">
                          <Clock3 size={22} />
                          <span>
                            No weekly working hours configured.
                          </span>
                        </div>
                      ) : (
                        <div className="schedule-grid">
                          {DAYS.map((day) => {
                            const schedule = schedules.find(
                              (item) =>
                                Number(item.day_of_week) === day.value
                            );

                            return (
                              <div
                                className={`schedule-day ${
                                  schedule ? "configured" : ""
                                }`}
                                key={day.value}
                              >
                                <div className="schedule-day-top">
                                  <strong>{day.label}</strong>

                                  {schedule ? (
                                    <span className="schedule-dot" />
                                  ) : null}
                                </div>

                                {schedule ? (
                                  <>
                                    <span className="schedule-time">
                                      {formatTime(schedule.start_time)} –{" "}
                                      {formatTime(schedule.end_time)}
                                    </span>

                                    <span className="schedule-duration">
                                      {schedule.slot_duration} min slots
                                    </span>

                                    <button
                                      type="button"
                                      className="text-danger-button"
                                      onClick={() =>
                                        deleteSchedule(schedule)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </>
                                ) : (
                                  <span className="schedule-off">
                                    Not scheduled
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="detail-section">
                      <div className="detail-section-header">
                        <div>
                          <h3>Schedule overrides</h3>
                          <p>
                            Change working hours or mark specific dates
                            as days off.
                          </p>
                        </div>

                        {selectedTherapist.is_active && (
                          <button
                            type="button"
                            className="secondary-button small"
                            onClick={openAddOverride}
                          >
                            <Plus size={15} />
                            Add override
                          </button>
                        )}
                      </div>

                      {overrides.length === 0 ? (
                        <div className="profile-empty">
                          <CalendarDays size={22} />
                          <span>
                            No date-specific overrides configured.
                          </span>
                        </div>
                      ) : (
                        <div className="override-list">
                          {overrides
                            .slice()
                            .sort((a, b) =>
                              a.override_date.localeCompare(
                                b.override_date
                              )
                            )
                            .map((override) => (
                              <div
                                className="override-row"
                                key={override.id}
                              >
                                <div className="override-date">
                                  <strong>
                                    {new Date(
                                      `${override.override_date}T00:00:00`
                                    ).toLocaleDateString([], {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </strong>
                                </div>

                                <div className="override-details">
                                  {override.is_day_off ? (
                                    <span className="status-inactive">
                                      Day Off
                                    </span>
                                  ) : (
                                    <>
                                      <span>
                                        {formatTime(
                                          override.start_time
                                        )}{" "}
                                        –{" "}
                                        {formatTime(
                                          override.end_time
                                        )}
                                      </span>

                                      <span className="schedule-duration">
                                        {override.slot_duration} min slots
                                      </span>
                                    </>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="text-danger-button"
                                  onClick={() =>
                                    deleteOverride(override)
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {therapistModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">THERAPIST</p>
                <h2>
                  {editingTherapist
                    ? "Edit therapist"
                    : "Add therapist"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setTherapistModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="patient-form"
              onSubmit={saveTherapist}
            >
              <div className="form-field">
                <label htmlFor="therapist-name">Full name</label>
                <input
                  id="therapist-name"
                  type="text"
                  required
                  value={therapistForm.name}
                  onChange={(event) =>
                    setTherapistForm({
                      ...therapistForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Dr. Maya Sharma"
                />
              </div>

              <div className="form-field">
                <label htmlFor="therapist-specialty">
                  Specialty
                </label>
                <input
                  id="therapist-specialty"
                  type="text"
                  required
                  value={therapistForm.specialty}
                  onChange={(event) =>
                    setTherapistForm({
                      ...therapistForm,
                      specialty: event.target.value,
                    })
                  }
                  placeholder="e.g. Orthopedic Physiotherapy"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setTherapistModalOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save therapist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleModalOpen && selectedTherapist && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">WORKING HOURS</p>
                <h2>Add weekly schedule</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setScheduleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="patient-form"
              onSubmit={saveSchedule}
            >
              <div className="form-field">
                <label htmlFor="schedule-day">Day</label>
                <select
                  id="schedule-day"
                  value={scheduleForm.day_of_week}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      day_of_week: Number(event.target.value),
                    })
                  }
                >
                  {DAYS.map((day) => (
                    <option
                      value={day.value}
                      key={day.value}
                    >
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="schedule-start">
                    Start time
                  </label>
                  <input
                    id="schedule-start"
                    type="time"
                    required
                    value={scheduleForm.start_time}
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        start_time: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-end">
                    End time
                  </label>
                  <input
                    id="schedule-end"
                    type="time"
                    required
                    value={scheduleForm.end_time}
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        end_time: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="schedule-duration">
                  Appointment slot duration
                </label>
                <select
                  id="schedule-duration"
                  value={scheduleForm.slot_duration}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      slot_duration: Number(event.target.value),
                    })
                  }
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setScheduleModalOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {overrideModalOpen && selectedTherapist && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">DATE OVERRIDE</p>
                <h2>Add schedule override</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setOverrideModalOpen(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="patient-form"
              onSubmit={saveOverride}
            >
              <div className="form-field">
                <label htmlFor="override-date">Date</label>
                <input
                  id="override-date"
                  type="date"
                  required
                  value={overrideForm.override_date}
                  onChange={(event) =>
                    setOverrideForm({
                      ...overrideForm,
                      override_date: event.target.value,
                    })
                  }
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={overrideForm.is_day_off}
                  onChange={(event) =>
                    setOverrideForm({
                      ...overrideForm,
                      is_day_off: event.target.checked,
                    })
                  }
                />
                <span>Mark this date as a day off</span>
              </label>

              {!overrideForm.is_day_off && (
                <>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="override-start">
                        Start time
                      </label>
                      <input
                        id="override-start"
                        type="time"
                        required
                        value={overrideForm.start_time}
                        onChange={(event) =>
                          setOverrideForm({
                            ...overrideForm,
                            start_time: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="override-end">
                        End time
                      </label>
                      <input
                        id="override-end"
                        type="time"
                        required
                        value={overrideForm.end_time}
                        onChange={(event) =>
                          setOverrideForm({
                            ...overrideForm,
                            end_time: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="override-duration">
                      Slot duration
                    </label>
                    <select
                      id="override-duration"
                      value={overrideForm.slot_duration}
                      onChange={(event) =>
                        setOverrideForm({
                          ...overrideForm,
                          slot_duration: Number(
                            event.target.value
                          ),
                        })
                      }
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setOverrideModalOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}