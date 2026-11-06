# WIFAQ وفاق: Clickable Prototype

**Team MED-4UVN49 · MEDATHON 2026 · Track 2: Healthcare Digital Transformation**

WIFAQ is a digital platform and managed service that lets one hospital coordinate every pharmaceutical **patient-support program (PSP)** it hosts. Instead of each sponsor running a separate vendor, workflow and reporting process, WIFAQ gives the hospital one coordination layer that it controls.

This repository holds the **MVP prototype**: a clickable front end of the three role-based workspaces.

> ⚠️ **Demo data only.** Every patient, caregiver, coordinator, sponsor, hospital and figure in this prototype is fictional. No real patient data is used, collected or stored. There is no back end; nothing leaves the browser.

---

## Try it

**Online:** open the GitHub Pages link in the repository's "About" section (see *Publishing* below).

**Locally:** download or clone the repository and open `index.html` in any modern browser. No installation or build step is needed.

Use **Reset demo** (top right) at any time to restore the starting data.

---

## The three workspaces

| Workspace | Who uses it | What it shows |
|---|---|---|
| **WIFAQ Operations** | WIFAQ coordinators | All cases across sponsor programs, care-plan tasks, contact logging, adverse-event capture, escalation to the hospital clinical team |
| **Hospital Portal** | Hospital program administrator | Approved programs and scope, approval queue, consent recording, clinical escalations, full audit log |
| **Sponsor Portal** | Pharmaceutical sponsor | Aggregate, hospital-released figures for **its own program only**, released reports (CSV download), agreement terms |

All three share one data state, so an action in one workspace shows up in the others.

## Suggested 2-minute walkthrough

1. **WIFAQ Operations → Overview:** one list of cases across two sponsor programs (Demo Pharma A and B).
2. Open **Case AD-104** → change a task status, **+ Add task**, then **Log call**. Tick *possible adverse event*: the contact is logged, forwarded for pharmacovigilance and escalated to the hospital.
3. Open **Case AD-112**: **Log call is blocked** because the hospital has not verified consent.
4. Switch to **Hospital Portal → Consent** → *Record consent verified* for AD-112. Back in Operations, outreach is now unlocked.
5. **Hospital Portal → Approvals** → review the *October aggregate report* → **Approve & release**.
6. **Hospital Portal → Escalations** → acknowledge, then mark reviewed. **Audit log** shows every step.
7. Switch to **Sponsor Portal**: Demo Pharma A now sees the October report. Switch to **Demo Pharma B**: it sees only its own program, and nothing that the hospital has not released.

## Governance rules the prototype demonstrates

- **Consent gate:** no outreach until the hospital records verified consent.
- **Hospital approval:** education material and every sponsor report need hospital approval before use or release.
- **Sponsor separation:** each sponsor sees aggregate figures for its own program only; no names, contact details or case IDs.
- **Clinical boundary:** coordinators escalate; clinical decisions stay with the hospital team.
- **Safety reporting:** possible adverse events captured during contacts are flagged for the sponsor's pharmacovigilance process.
- **Audit trail:** approvals, releases, consent, escalations and task changes are logged.

## What this prototype is, and is not

| Built (this repository) | Not yet built |
|---|---|
| Front-end workflow for 3 roles | Back end, database and user authentication |
| Role-based views and permissions logic (client-side) | Hospital system integration (HIS/EHR) |
| Consent gate, approval and release flow, audit log | Security review, PDPL impact assessment, in-Kingdom hosting |
| Adverse-event capture and escalation flow | Validation with real hospital staff and sponsors |

## Tech

Plain HTML, CSS and JavaScript (no framework, no build, no external requests). Demo state is kept in the browser's local storage and can be reset at any time.

```
index.html     page shell and role switcher
styles.css     styling (responsive)
app.js         views, actions and shared state
data.js        fictional seed data
assets/        logo mark
screenshots/   images of each workspace
```

## Publishing on GitHub Pages

1. Repository **Settings → Pages**.
2. *Source:* **Deploy from a branch** · *Branch:* `main` · *Folder:* `/ (root)` → **Save**.
3. After about a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.
4. Add that link to the repository's **About** section and to the MEDATHON submission.

## Screenshots

| | |
|---|---|
| ![Operations overview](screenshots/01-operations-overview.png) | ![Case view](screenshots/02-operations-case.png) |
| ![Hospital programs](screenshots/03-hospital-programs.png) | ![Report approval](screenshots/04-hospital-approval.png) |
| ![Audit log](screenshots/05-hospital-audit.png) | ![Sponsor overview](screenshots/06-sponsor-overview.png) |

## Team

- **Reema Alhawas**, CEO: partnerships and strategy
- **Layan Tarboush**, CFO: finance and commercial planning
- **Salma Ansary**, COO: operations and pilot delivery
