"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Check,
    DollarSign,
    Edit3,
    FileText,
    Plus,
    Search,
    Ban,
    X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import api from "@/lib/api";
import "./billing.css"

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function formatCurrency(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NPR",
        minimumFractionDigits: 2,
    }).format(amount);
}

function getNetAmount(invoice) {
    return Math.max(
        Number(invoice.amount || 0) - Number(invoice.discount || 0),
        0,
    );
}

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function BillingPage() {
    const [invoices, setInvoices] = useState([]);
    const [patients, setPatients] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);

    const [form, setForm] = useState({
        patient_id: "",
        service: "",
        amount: "",
        discount: "0",
        status: "Due",
        payment_method: "",
        invoice_date: getToday(),
    });

    async function loadPatients() {
        try {
            const response = await api.get("/api/patients", {
                params: {
                    status: "Active",
                },
            });

            setPatients(
                Array.isArray(response.data) ? response.data : [],
            );
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Unable to load patients.",
            );
        }
    }

    async function loadInvoices() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/invoices");

            setInvoices(
                Array.isArray(response.data) ? response.data : [],
            );
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Unable to load invoices.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPatients();
        loadInvoices();
    }, []);

    function getPatient(patientId) {
        return patients.find((patient) => patient.id === patientId);
    }

    function getPatientName(patientId) {
        return (
            getPatient(patientId)?.name ||
            `Patient #${patientId}`
        );
    }

    const filteredInvoices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return invoices.filter((invoice) => {
            const patientName = getPatientName(
                invoice.patient_id,
            ).toLowerCase();

            const service = String(invoice.service || "").toLowerCase();

            const matchesSearch =
                !query ||
                patientName.includes(query) ||
                service.includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                invoice.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [invoices, search, statusFilter, patients]);

    const summary = useMemo(() => {
        let paid = 0;
        let due = 0;

        invoices.forEach((invoice) => {
            const amount = getNetAmount(invoice);

            if (invoice.status === "Paid") {
                paid += amount;
            }

            if (invoice.status === "Due") {
                due += amount;
            }
        });

        return {
            total: invoices.length,
            paid,
            due,
        };
    }, [invoices]);

    function resetForm() {
        setForm({
            patient_id: "",
            service: "",
            amount: "",
            discount: "0",
            status: "Due",
            payment_method: "",
            invoice_date: getToday(),
        });
    }

    function openCreateModal() {
        setEditingInvoice(null);
        resetForm();
        setError("");
        setShowModal(true);
    }

    function openEditModal(invoice) {
        setEditingInvoice(invoice);

        setForm({
            patient_id: String(invoice.patient_id),
            service: invoice.service || "",
            amount: String(invoice.amount || ""),
            discount: String(invoice.discount || "0"),
            status: invoice.status || "Due",
            payment_method: invoice.payment_method || "",
            invoice_date:
                invoice.invoice_date || getToday(),
        });

        setError("");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setEditingInvoice(null);
    }

    function updateForm(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function saveInvoice(event) {
        event.preventDefault();

        if (!form.patient_id) {
            setError("Please select a patient.");
            return;
        }

        if (!form.service.trim()) {
            setError("Please enter a service.");
            return;
        }

        if (Number(form.amount) <= 0) {
            setError("Invoice amount must be greater than zero.");
            return;
        }

        if (Number(form.discount) < 0) {
            setError("Discount cannot be negative.");
            return;
        }

        if (Number(form.discount) > Number(form.amount)) {
            setError("Discount cannot be greater than the amount.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                patient_id: Number(form.patient_id),
                service: form.service.trim(),
                amount: Number(form.amount),
                discount: Number(form.discount || 0),
                status: form.status,
                payment_method:
                    form.payment_method || null,
                invoice_date: form.invoice_date,
            };

            if (editingInvoice) {
                await api.put(
                    `/api/invoices/${editingInvoice.id}`,
                    payload,
                );
            } else {
                await api.post("/api/invoices", payload);
            }

            closeModal();
            await loadInvoices();
        } catch (err) {
            console.error(err);

            const detail = err?.response?.data?.detail;

            if (Array.isArray(detail)) {
                setError(
                    detail
                        .map((item) => item.msg || "Invalid request")
                        .join(", "),
                );
            } else {
                setError(
                    detail || "Unable to save invoice.",
                );
            }
        } finally {
            setSaving(false);
        }
    }

    async function markAsPaid(invoice) {
        const confirmed = window.confirm(
            `Mark invoice for ${getPatientName(
                invoice.patient_id,
            )} as paid?`,
        );

        if (!confirmed) return;

        try {
            setError("");

            await api.patch(
                `/api/invoices/${invoice.id}/pay`,
                {
                    payment_method:
                        invoice.payment_method || "Cash",
                },
            );

            await loadInvoices();
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Unable to mark invoice as paid.",
            );
        }
    }

    async function voidInvoice(invoice) {
        const confirmed = window.confirm(
            `Void this invoice for ${getPatientName(
                invoice.patient_id,
            )}?\n\nThe invoice will remain in the system but will no longer be considered an active invoice.`,
        );

        if (!confirmed) return;

        try {
            setError("");

            await api.patch(
                `/api/invoices/${invoice.id}/void`,
            );

            await loadInvoices();
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Unable to void invoice.",
            );
        }
    }

    return (
        <AppShell>
            <div className="billing-page">
                <div className="page-header-row">
                    <div>
                        <p className="eyebrow">Financial management</p>

                        <h1>Billing</h1>

                        <p className="page-subtitle">
                            Manage invoices, payments and outstanding balances.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={openCreateModal}
                    >
                        <Plus size={18} />
                        Create invoice
                    </button>
                </div>

                {error && (
                    <div className="billing-error">
                        <span>{error}</span>

                        <button
                            className="icon-button small"
                            onClick={() => setError("")}
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                <div className="billing-summary">
                    <div className="billing-summary-card">
                        <div className="billing-summary-icon">
                            <FileText size={19} />
                        </div>

                        <div>
                            <span>Total invoices</span>
                            <strong>{summary.total}</strong>
                        </div>
                    </div>

                    <div className="billing-summary-card">
                        <div className="billing-summary-icon success">
                            <Check size={19} />
                        </div>

                        <div>
                            <span>Collected</span>
                            <strong>
                                {formatCurrency(summary.paid)}
                            </strong>
                        </div>
                    </div>

                    <div className="billing-summary-card">
                        <div className="billing-summary-icon due">
                            <DollarSign size={19} />
                        </div>

                        <div>
                            <span>Outstanding</span>
                            <strong>
                                {formatCurrency(summary.due)}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="billing-filter-card">
                    <div className="billing-search">
                        <Search size={17} />

                        <input
                            type="search"
                            placeholder="Search patient or service..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="billing-status-filters">
                        {["All", "Paid", "Due", "Voided"].map((status) => (
                            <button
                                key={status}
                                className={
                                    statusFilter === status
                                        ? "billing-filter active"
                                        : "billing-filter"
                                }
                                onClick={() =>
                                    setStatusFilter(status)
                                }
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="billing-table-card">
                    <div className="table-header">
                        <div>
                            <h2>Invoices</h2>
                            <span>
                                {filteredInvoices.length} result
                                {filteredInvoices.length === 1
                                    ? ""
                                    : "s"}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="billing-loading">
                            Loading invoices...
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="empty-state billing-empty">
                            <FileText size={28} />

                            <h3>No invoices found</h3>

                            <p>
                                Create an invoice or change your search
                                and filter.
                            </p>
                        </div>
                    ) : (
                        <div className="responsive-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Service</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Discount</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td>
                                                <button
                                                    className="billing-patient-button"
                                                    onClick={() =>
                                                        openEditModal(invoice)
                                                    }
                                                >
                                                    {getPatientName(
                                                        invoice.patient_id,
                                                    )}
                                                </button>
                                            </td>

                                            <td>{invoice.service}</td>

                                            <td>
                                                {formatDate(
                                                    invoice.invoice_date,
                                                )}
                                            </td>

                                            <td>
                                                {formatCurrency(
                                                    invoice.amount,
                                                )}
                                            </td>

                                            <td>
                                                {formatCurrency(
                                                    invoice.discount,
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatCurrency(
                                                        getNetAmount(invoice),
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        invoice.status === "Paid"
                                                            ? "status-paid"
                                                            : invoice.status === "Voided"
                                                                ? "status-voided"
                                                                : "status-due"
                                                    }
                                                >
                                                    {invoice.status === "Voided" && <Ban size={13} />}
                                                    {invoice.status}
                                                </span>
                                            </td>

                                            <td>
                                                {invoice.payment_method || "-"}
                                            </td>

                                            <td>
                                                <div className="table-actions">
                                                    {invoice.status === "Due" && (
                                                        <button
                                                            className="icon-button"
                                                            title="Mark as paid"
                                                            onClick={() =>
                                                                markAsPaid(invoice)
                                                            }
                                                        >
                                                            <Check size={15} />
                                                        </button>
                                                    )}

                                                    <button
                                                        className="icon-button"
                                                        title="Edit invoice"
                                                        onClick={() =>
                                                            openEditModal(invoice)
                                                        }
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>

                                                    {invoice.status !== "Voided" && (
                                                        <button
                                                            className="icon-button danger"
                                                            title="Void invoice"
                                                            onClick={() => voidInvoice(invoice)}
                                                        >
                                                            <Ban size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="modal-card billing-modal">
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">
                                    {editingInvoice
                                        ? "Invoice"
                                        : "New invoice"}
                                </p>

                                <h2>
                                    {editingInvoice
                                        ? "Edit invoice"
                                        : "Create invoice"}
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
                            onSubmit={saveInvoice}
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
                                        <option value="">
                                            Select patient
                                        </option>

                                        {patients.map((patient) => (
                                            <option
                                                key={patient.id}
                                                value={patient.id}
                                            >
                                                {patient.name} —{" "}
                                                {patient.phone}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-field">
                                    <span>Invoice date *</span>

                                    <input
                                        type="date"
                                        value={form.invoice_date}
                                        onChange={(event) =>
                                            updateForm(
                                                "invoice_date",
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label className="form-field form-field-full">
                                    <span>Service / package *</span>

                                    <input
                                        type="text"
                                        value={form.service}
                                        onChange={(event) =>
                                            updateForm(
                                                "service",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. Physiotherapy Package"
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    <span>Amount *</span>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(event) =>
                                            updateForm(
                                                "amount",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    <span>Discount</span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.discount}
                                        onChange={(event) =>
                                            updateForm(
                                                "discount",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                    />
                                </label>

                                <label className="form-field">
                                    <span>Status</span>

                                    <select
                                        value={form.status}
                                        onChange={(event) =>
                                            updateForm(
                                                "status",
                                                event.target.value,
                                            )
                                        }
                                    >
                                        <option value="Due">Due</option>
                                        <option value="Paid">Paid</option>
                                    </select>
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
                                        <option value="">
                                            Not specified
                                        </option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Bank Transfer">
                                            Bank Transfer
                                        </option>
                                        <option value="Online">
                                            Online
                                        </option>
                                    </select>
                                </label>
                            </div>

                            <div className="invoice-total-preview">
                                <span>Net invoice amount</span>

                                <strong>
                                    {formatCurrency(
                                        Math.max(
                                            Number(form.amount || 0) -
                                            Number(form.discount || 0),
                                            0,
                                        ),
                                    )}
                                </strong>
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
                                        : editingInvoice
                                            ? "Save changes"
                                            : "Create invoice"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}