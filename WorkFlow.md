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

ROLE:   Primary                     
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
USAGES: Pending, on-hold, informational states

Use the "Primary/Secondary/Tertiary" roles for structural UI (buttons, nav, backgrounds) and the "Status" roles only for status tags/badges - don't mix the two systems.
---

# 3/3. Typography
    a. Display / Headings: Fraunces (serif) - page titles, card values, section headings.
    b. Body / UI: Inter (sans-serif) - all body text, labels, buttons, table content.
    c. Numeric / data: IBM Plex Mono - stat numbers, invoice amounts, time slots, IDs.
    D. Both fonts are freely available via Google Fonts.
---

# 3.4. Layout conventions
    a.Persistent left sidebar (dark, Secondary-colored background) with the app logo/name at top and nav items (Dashboard, Patients, Schedule, Billing, Therapists); active item highlighted in Primary
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
    - Overview (key-value info)- Session history (date, therapist, type, notes)- Billing history for that patient
