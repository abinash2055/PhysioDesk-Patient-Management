"use client";

import { useEffect, useState } from "react";
import {
    Edit3,
    Plus,
    Search,
    UserRound,
    X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import "./patient.css"

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);

  const [search, setSearch] = useState("");
  const [therapistId, setTherapistId] =
    useState("");
  const [patientStatus, setPatientStatus] =
    useState("Active");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingPatient, setEditingPatient] =
    useState(null);

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (therapistId) {
        params.therapist_id = therapistId;
      }

      if (patientStatus) {
        params.status = patientStatus;
      }

      const response = await api.get(
        "/api/patients",
        { params }
      );

      setPatients(response.data);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTherapists() {
    try {
      const response = await api.get(
        "/api/therapists"
      );

      setTherapists(response.data);
    } catch {
      // Patient list can still work if
      // therapist loading fails.
    }
  }

  useEffect(() => {
    loadTherapists();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadPatients();
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    search,
    therapistId,
    patientStatus,
  ]);

  function openCreateModal() {
    setEditingPatient(null);
    setShowModal(true);
  }

  function openEditModal(patient) {
    setEditingPatient(patient);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPatient(null);
  }

  async function deactivatePatient(patient) {
    const confirmed = window.confirm(
      `Deactivate ${patient.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/api/patients/${patient.id}/deactivate`
      );

      await loadPatients();

      if (
        selectedPatient?.id === patient.id
      ) {
        setSelectedPatient(null);
      }
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to deactivate patient."
      );
    }
  }

  return (
    <AppShell>
      <div className="page-header page-header-row">
        <div>
          <p className="eyebrow">
            Clinic records
          </p>

          <h1>Patients</h1>

          <p>
            Manage patient records and history.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          Add patient
        </button>
      </div>

      <div className="filter-card">
        <div className="search-field">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={therapistId}
          onChange={(event) =>
            setTherapistId(event.target.value)
          }
        >
          <option value="">
            All therapists
          </option>

          {therapists.map((therapist) => (
            <option
              key={therapist.id}
              value={therapist.id}
            >
              {therapist.name}
            </option>
          ))}
        </select>

        <select
          value={patientStatus}
          onChange={(event) =>
            setPatientStatus(event.target.value)
          }
        >
          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>

          <option value="">
            All statuses
          </option>
        </select>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Patient records</h2>

            <span>
              {patients.length} patient
              {patients.length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <UserRound size={28} />

            <strong>
              No patients found
            </strong>

            <span>
              Try changing your filters or
              add a new patient.
            </span>
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Condition</th>
                  <th>Therapist</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => {
                  const therapist =
                    therapists.find(
                      (item) =>
                        item.id ===
                        patient.therapist_id
                    );

                  return (
                    <tr key={patient.id}>
                      <td>
                        <button
                          type="button"
                          className="patient-name-button"
                          onClick={() =>
                            setSelectedPatient(
                              patient
                            )
                          }
                        >
                          {patient.name}
                        </button>
                      </td>

                      <td>
                        {patient.phone}
                      </td>

                      <td>
                        {patient.age}
                      </td>

                      <td>
                        {patient.condition}
                      </td>

                      <td>
                        {therapist?.name ||
                          "Unassigned"}
                      </td>

                      <td>
                        <span
                          className={
                            patient.status ===
                            "Active"
                              ? "status-pill status-active"
                              : "status-pill status-inactive"
                          }
                        >
                          {patient.status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit patient"
                            onClick={() =>
                              openEditModal(
                                patient
                              )
                            }
                          >
                            <Edit3 size={16} />
                          </button>

                          {patient.status ===
                            "Active" && (
                            <button
                              type="button"
                              className="text-danger-button"
                              onClick={() =>
                                deactivatePatient(
                                  patient
                                )
                              }
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <PatientModal
          patient={editingPatient}
          therapists={therapists}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            loadPatients();
          }}
        />
      )}

      {selectedPatient && (
        <PatientProfile
          patient={selectedPatient}
          therapist={therapists.find(
            (item) =>
              item.id ===
              selectedPatient.therapist_id
          )}
          onClose={() =>
            setSelectedPatient(null)
          }
        />
      )}
    </AppShell>
  );
}

function PatientModal({
  patient,
  therapists,
  onClose,
  onSaved,
}) {
  const editing = Boolean(patient);

  const [form, setForm] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    age: patient?.age || "",
    gender: patient?.gender || "",
    address: patient?.address || "",
    condition: patient?.condition || "",
    therapist_id:
      patient?.therapist_id || "",
    package: patient?.package || "",
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSaving(true);

    const payload = {
      ...form,
      age: Number(form.age),
      therapist_id: form.therapist_id
        ? Number(form.therapist_id)
        : null,
    };

    try {
      if (editing) {
        await api.put(
          `/api/patients/${patient.id}`,
          payload
        );
      } else {
        await api.post(
          "/api/patients",
          payload
        );
      }

      onSaved();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to save patient."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              Patient record
            </p>

            <h2>
              {editing
                ? "Edit patient"
                : "Add patient"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="patient-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <div className="form-field">
              <label>Name *</label>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-field">
              <label>Phone *</label>

              <input
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-field">
              <label>Age *</label>

              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(event) =>
                  updateField(
                    "age",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-field">
              <label>Gender *</label>

              <select
                value={form.gender}
                onChange={(event) =>
                  updateField(
                    "gender",
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>Address</label>

              <textarea
                rows="2"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Condition *</label>

              <input
                value={form.condition}
                onChange={(event) =>
                  updateField(
                    "condition",
                    event.target.value
                  )
                }
                placeholder="e.g. Lower back pain"
                required
              />
            </div>

            <div className="form-field">
              <label>Assigned therapist</label>

              <select
                value={form.therapist_id}
                onChange={(event) =>
                  updateField(
                    "therapist_id",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Unassigned
                </option>

                {therapists
                  .filter(
                    (therapist) =>
                      therapist.is_active
                  )
                  .map((therapist) => (
                    <option
                      key={therapist.id}
                      value={therapist.id}
                    >
                      {therapist.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>Package</label>

              <input
                value={form.package}
                onChange={(event) =>
                  updateField(
                    "package",
                    event.target.value
                  )
                }
                placeholder="e.g. 10 Session Package"
              />
            </div>
          </div>

          {error && (
            <div className="page-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
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
                : editing
                ? "Save changes"
                : "Add patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientProfile({
  patient,
  therapist,
  onClose,
}) {
  const [appointments, setAppointments] =
    useState([]);

  const [invoices, setInvoices] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const [
          appointmentsResponse,
          invoicesResponse,
        ] = await Promise.all([
          api.get("/api/appointments", {
            params: {
              patient_id: patient.id,
            },
          }),

          api.get(
            `/api/invoices/patient/${patient.id}`
          ),
        ]);

        setAppointments(
          appointmentsResponse.data
        );

        setInvoices(
          invoicesResponse.data
        );
      } catch {
        // Keep profile information visible
        // even if history fails.
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [patient.id]);

  return (
    <div className="modal-backdrop">
      <div className="profile-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              Patient profile
            </p>

            <h2>{patient.name}</h2>

            <p className="profile-subtitle">
              {patient.condition}
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="profile-grid">
          <div className="profile-info-card">
            <span>Phone</span>
            <strong>{patient.phone}</strong>
          </div>

          <div className="profile-info-card">
            <span>Age</span>
            <strong>{patient.age}</strong>
          </div>

          <div className="profile-info-card">
            <span>Gender</span>
            <strong>{patient.gender}</strong>
          </div>

          <div className="profile-info-card">
            <span>Therapist</span>
            <strong>
              {therapist?.name ||
                "Unassigned"}
            </strong>
          </div>

          <div className="profile-info-card">
            <span>Package</span>
            <strong>
              {patient.package ||
                "No package"}
            </strong>
          </div>

          <div className="profile-info-card">
            <span>Status</span>
            <strong>{patient.status}</strong>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <h3>Session history</h3>

            <span>
              {appointments.length}
            </span>
          </div>

          {loading ? (
            <div className="profile-empty">
              Loading history...
            </div>
          ) : appointments.length === 0 ? (
            <div className="profile-empty">
              No sessions recorded.
            </div>
          ) : (
            <div className="history-list">
              {appointments.map(
                (appointment) => (
                  <div
                    className="history-row"
                    key={appointment.id}
                  >
                    <div>
                      <strong>
                        {appointment.appointment_date}
                      </strong>

                      <span>
                        {
                          appointment.start_time
                        }{" "}
                        —{" "}
                        {
                          appointment.end_time
                        }
                      </span>
                    </div>

                    <div>
                      <span className="status-pill">
                        {appointment.status}
                      </span>

                      {appointment.session_type && (
                        <small>
                          {
                            appointment.session_type
                          }
                        </small>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-heading">
            <h3>Billing history</h3>

            <span>
              {invoices.length}
            </span>
          </div>

          {loading ? (
            <div className="profile-empty">
              Loading billing...
            </div>
          ) : invoices.length === 0 ? (
            <div className="profile-empty">
              No invoices recorded.
            </div>
          ) : (
            <div className="history-list">
              {invoices.map((invoice) => (
                <div
                  className="history-row"
                  key={invoice.id}
                >
                  <div>
                    <strong>
                      {invoice.service}
                    </strong>

                    <span>
                      {invoice.invoice_date}
                    </span>
                  </div>

                  <div className="invoice-history-right">
                    <strong>
                      NPR{" "}
                      {Number(
                        invoice.amount -
                          invoice.discount
                      ).toLocaleString()}
                    </strong>

                    <span
                      className={
                        invoice.status ===
                        "Paid"
                          ? "status-pill status-active"
                          : invoice.status ===
                            "Voided"
                          ? "status-pill status-inactive"
                          : "status-pill status-due"
                      }
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}