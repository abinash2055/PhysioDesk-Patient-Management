## PhysioDesk -- Full Stack Developer Take-Home Assignment
---

# Role: 
Full Stack Developer (2+ years experience) Time budget: 5 - 7 calendar days (expected effort: ~10 - 15 focused hours - do not over-engineer) Submission: Public/private Git repository link (GitHub/GitLab/Bitbucket) with commit history intact.
--- 

## 1. Context
PhysioDesk is a clinic management tool for a physiotherapy practice. Your task is to design and build a working full-stack application from the specification below - a real backend with a database, REST APIs, authentication, and a connected frontend. There is no reference prototype file provided. The functional spec in Section 3, to gether with the fixed design system in Section 3.0, is the full source of truth for what to build and how it should look. You're free to make your own technical/architecture decisions, but the visual design (colors, typography, layout conventions) is fixed - not open-ended. Where something is genuinely ambiguous and not covered below, make a reasonable assumption, document it in your README, and move on.
---

## 2. Tech Stack (required)
This project must be built with:
    - Backend: Python, FastAPI
    - Frontend: Next.js
    - Database: PostgreSQL
    - ORM/migrations: yourchoice(e.g. SQLAlchemy+Alembic, orsimilar) - state your choice in the README

Please don't substitute a different stack - we're evaluating how you work within these specific tools, since this is what our team uses day to day.
---

## 3.  Functional Requirements

# 3.1.  Design System (required, not optional)
The UI must follow this design system exactly - do not substitute your own color palette, fonts, or overall visual style. Layout of individual screens (spacing, exact component placement) can use your judgment, but the visual language below is fixed.

# 3.2. Color Palette

## Color Palette

| Role | HEX | Usages |
|---|---|---|
| **Primary** | `#B8763A` | Primary buttons, active nav item, key highlights/CTAs |
| **Primary - Text on Soft** | `#5C3A17` | Text placed on Primary Soft backgrounds |
| **Primary - Soft** | `#F0DFC7` | Tinted backgrounds/badges using the primary color |
| **Secondary** | `#132420` | Sidebar background; secondary dark surface |
| **Secondary - Light** | `#1D362F` | Sidebar hover state / active surface on dark background |
| **Tertiary** | `#4F7C63` | Tertiary accent; also reused as the Success status color |
| **Tertiary - Soft** | `#E1EBE3` | Tertiary/success tag background |
| **Background** | `#F6F3EA` | App/page background |
| **Surface (cards/panels)** | `#FFFFFF` | Card and panel background |
| **Border** | `#E4DFD1` | Card borders, input borders, dividers |
| **Text - Primary** | `#1C2622` | Main body text, headings |
| **Text - Secondary (muted)** | `#797365` | Supporting/secondary text, captions |
| **Status - Success** | `#4F7C63`<br>Soft: `#E1EBE3` | Paid, active, booked/positive states |
| **Status - Error/Danger** | `#B5493B`<br>Soft: `#F3DEDA` | Overdue, cancelled, destructive actions |
| **Status - Neutral/Info** | `#5E6B78`<br>Soft: `#E7EBEE` | Pending, on-hold, informational states |

<!-- ROLE:   Primary                     
HEX:    #B8763A   
USAGES: Primary buttons, active nav item, key highlights/CTAs  

ROLE:   Primary - Text on Soft      
HEX:    #5C3A17
USAGES: Text placed on Primary Soft backgrounds

ROLE:   Primary - Soft             
HEX:    #F0DFC7
USAGES: Tinted backgrounds/badges using the primary color

ROLE:   Secondary  
HEX:    #132420
USAGES: Sidebar background; secondary dark surface

ROLE:   Secondary - Light           
HEX:    #1D362F
USAGES: Sidebar hover state / active surface on dark background

ROLE:   Tertiary                    
HEX:    #4F7C63
USAGES: Tertiary accent; also reused as the "Success" status color

ROLE:   Tertiary - Soft             
HEX:    #E1EBE3
USAGES: Tertiary/success tag background

ROLE:   Background                  
HEX:    #F6F3EA 
USAGES: App/page background

ROLE:   Surface (cards/panels)      
HEX:    #FFFFFF
USAGES: Card and panel background 

ROLE:   Border                      
HEX:    #E4DFD1
USAGES: Card borders, input borders, dividers

ROLE:   Text - Primary              
HEX:    #1C2622
USAGES: Main body text, headings

ROLE:   Text - Secondary (muted)    
HEX:    #797365
USAGES: Supporting/secondary text, captions

ROLE:   Status - Success            
HEX:    #4F7C63 (soft: #E1EBE3)
USAGES: Paid, active, booked/positive states

ROLE:   Status - Error/Danger       
HEX:    #B5493B (soft: #F3DEDA)
USAGES: Overdue, cancelled, destructive actions

ROLE:   Status - Neutral/Info       
HEX:    #5E6B78 (soft: #E7EBEE)
USAGES: Pending, on-hold, informational states -->

Use the "Primary/Secondary/Tertiary" roles for structural UI (buttons, nav, backgrounds) and the "Status" roles only for status tags/badges - don't mix the two systems.
---

# 3/3. Typography
    a. Display / Headings: Fraunces (serif) - page titles, card values, section headings.
    b. Body / UI: Inter (sans-serif) - all body text, labels, buttons, table content.
    c. Numeric / data: IBM Plex Mono - stat numbers, invoice amounts, time slots, IDs.
    D. Both fonts are freely available via Google Fonts.
---

# 3.4. Layout conventions
    a. Persistent left sidebar (dark, Secondary-colored background) with the app logo/name at top and nav items (Dashboard, Patients, Schedule, Billing, Therapists); active item highlighted in Primary
    b. Main content area on the Background color, with a top bar showing the page title plus primary action button(s)
    c. Content presented in Surface (white) cards/panels with rounded corners(~14px), a subtle Border, and a soft drop shadow - not flat, borderless sections
    d. Dashboard stat cards (Fraunces numerals) for key metrics (patients today, revenue, etc.)
    e. Status/tag pills - small rounded-pill badges, color-coded using the Status roles above (Success for Paid/Active, Error for Overdue/Cancelled, Neutral for Pending/On-hold)
    f. Tables for list views (patients, invoices, therapists) with a toolbar above containing search + filter dropdowns
    g. Modals (centered overlay dialogs) for Add/Edit forms (new patient, book appointment, create bill, add therapist) rather than full-page forms

You may reference any publicly available clinic/dashboard UI for layout inspiration as long as the palette, fonts, and conventions above are respected - the goal is a consistent, intentional design, not a generic unstyled CRUD app.
---

# 3.5.  Authentication & Authorization (required)
    a. User login (email/username + password), with securely hashed passwords (e.g. bcrypt/argon2)
    b. Token-based session handling (e.g. JWT access/refresh tokens)
    c. Atleast two roles: Admin (full access) and Staff/Receptionist (no access to, or read-only access to, billing and therapist management - your call, just define and enforce it)
    d. All API routes other than login must require a valid authenticated session
    e. Frontend must redirect unauthenticated users to a login page and hide/disable UI actions the current role isn-t permitted to perform
---

# 3.6. Dashboard
    a. Show live, computed stats (not hardcoded):
        - Patients seen today
        - Therapists on duty today
        - Revenue collected today
        - Open slots remaining today (across all therapists)
    b. Therapist capacity view - for each therapist on duty today, show their booked vs. free time slots for the day (a visual slot grid, a simple list, a table - your call)
    c. Recent patients - last N patients added, with condition, assigned therapist, package, and status
---

# 3.7. Patients
1. Full CRUD:
    a. Create -  add patient (name, phone, age, gender, address, condition, assigned therapist, package)
    b. Read - list view with:- Search by name or phone Filter by therapist- Filter by status (e.g. Active / Completed / On hold - your schema)
    c. Update -  edit patient details
    d. Delete - remove a patient (with confirmation)

2. Patient profile page - clicking a patient opens a detail view with at least:
    a. Overview (key-value info)- Session history (date, therapist, type, notes)- Billing history for that patient
---

# 3.8. Scheduling
    a. Calendar/grid view: therapists as columns, time slots as rows (or your own layout), for a selectable date
    b. Each cell shows: open, booked (with patient name), or therapist-off
    c. Book appointment: select patient, therapist, date, time slot, payment method, optional notes. Must respect the therapist's actual availability (no double-booking the same therapist/slot)
    d. Clicking a booked slot shows appointment details and allows reschedule
---

# 3.9. Billing
Full CRUD for invoices:
    a. Create - generate a bill for a patient (service/package, discount, status: Paid/Due, payment method)
    b. Read - list all invoices with patient, date, service, amount, status; support filtering by status
    c. Update - edit an invoice (e.g. mark a Due invoice as Paid) 
    d. Delete - void/remove an invoice
Bonus: printable/exportable invoice view
---

# 3.10. Therapists
Full CRUD (Admin only):
    a. Create - add therapist (name, specialty, working days, start/end time, slot duration)
    b. Read - roster list with specialty, weekly hours, patients seen today
    c. Update - edit therapist details and working schedule 
    d. Delete - remove a therapist (consider: what happens to their existing appointments? state your assumption)
Ability to override/assign a therapist-s schedule for a specific date (day off, custom hours)
---

## 4. Data Requirements
    a. Design your own PostgreSQL schema - Patients, Therapists, Appointments, Invoices, Users (for auth) are the expected core entities, plus whatever join/lookup tables you need
    b. Include a migration setup (e.g. Alembic) so the schema can be built from scratch with one command
    c. Include a seed script populating at least: 1 admin + 1 staff user, 8-10 patients, 3-4 therapists, a mix of past/future appointments, and paid/due invoices - so reviewers can log in and evaluate the app without manual data entry
---

## 5. Deliverables
    1. Source code in a Git repo with meaningful, incremental commits (not one giant commit)
    2. README.md including:
        a. Setup instructions (install, env vars, run migrations/seed, start backend + frontend)
        b. Test login credentials for both roles
        c. Any assumptions you made
        d. What you would do differently or add with more time
    3. A short demo-ascreenrecording (Loom or similar, 3-5 min) walking through the working features, OR the app deployed somewhere reachable (Render, Railway, Vercel, etc.) - either is acceptable
    4. API documentation - FastAPI's auto-generated OpenAPI/Swagger docs (/docs) are sufficient; just confirm it's reachable
---

## 6. Evaluation Criteria

## Evaluation Criteria

| Area | What We're Looking For |
|---|---|
| **Functional correctness** | Do CRUD flows, scheduling logic, and auth actually work end-to-end? |
| **Auth & authorization** | Passwords hashed, tokens handled correctly, roles genuinely enforced (not just hidden in UI). |
| **Code quality & structure** | Readable FastAPI project structure, sensible Next.js app organization, separation of concerns. |
| **API design** | RESTful conventions, Pydantic validation, sensible status codes, error handling. |
| **Data modeling** | Sensible PostgreSQL schema, relationships, no obvious data-integrity gaps. |
| **Frontend integration** | UI reflects real backend state, handles loading/error/auth states. |
| **Design system adherence** | Correct color palette, fonts (Fraunces/Inter/IBM Plex Mono), and layout conventions (sidebar, cards, tag pills, modals) as specified in 3.0. |
| **Git hygiene** | Commit history tells a story of how you worked. |
| **Documentation** | Can we run it from the README alone? |
| **Judgment** | Sensible scoping given the time budget - we'd rather see a smaller feature set done well than everything done poorly. |

<!-- AREA - Functional correctness
What we're looking for - Do CRUD flows, scheduling logic, and auth actually work end-to-end?

AREA - Auth & authorization
What we're looking for - Passwords hashed, tokens handled correctly, roles genuinely enforced (not just hidden in UI)

AREA - Code quality & structure
What we're looking for - Readable FastAPI project structure, sensible Next.js app organization, separation of concerns

AREA - API design
What we're looking for - RESTful conventions, Pydantic validation, sensible status codes, error handling

AREA - Data modeling
What we're looking for - Sensible PostgreSQL schema, relationships, no obvious data-integrity gaps

AREA - Frontend integration
What we're looking for - UI reflects real backend state, handles loading/error/auth states

AREA - Design system adherence
What we're looking for - Correct color palette, fonts (Fraunces/Inter/IBM Plex Mono), and layout conventions (sidebar, cards, tag pills, modals) as specified in 3.0

AREA - Git hygiene
What we're looking for - Commit history tells a story of how you worked

AREA - Documentation
What we're looking for - Can we run it from the README alone?

AREA - Judgment
What we're looking for - Sensible scoping given the time budget - we'd rather see a smaller feature set done well than everything done poorly -->

We are not grading pixel-perfect design polish or animation flourishes - but the palette, fonts, and layout conventions above are a fixed requirement, not a suggestion.
---

## 7. Bonus (fully optional, do not sacrifice core requirements for these)
    1. Pagination or infinite scroll on large lists
    2. Unit or integration tests for at least one core module (backend and/or frontend)
    3. Dockerized setup (docker-compose up to run Postgres + backend + frontend together)
    4. Conflict prevention UX (e.g. warning before double-booking)
    5. Refresh-token rotation / logout-everywhere handling
---

## 8. Questions

If anything is ambiguous, make a reasonable assumption, document it in your README, and move on - how you handle ambiguity is itself part of the evaluation. Feel free to reach out if you have any questions about the spec.

Good luck - we're looking forward to seeing what you build.
