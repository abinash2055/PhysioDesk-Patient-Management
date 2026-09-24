# Invoice Assumption;:

For dashboard revenue reporting, a Paid invoice is counted against its invoice_date because the current invoice model does not store a separate payment timestamp...


### Dashboard reporting assumptions

- "Patients seen today" is calculated from appointments with `Completed` status for the current date.
- Dashboard revenue counts invoices with `Paid` status and today's `invoice_date`.
- The current invoice model does not contain a separate payment timestamp, so `invoice_date` is used for daily collection reporting.
- Therapist capacity is calculated from the therapist's working hours and slot duration for the current day.
- Date-specific therapist schedule overrides take precedence over weekly schedules.