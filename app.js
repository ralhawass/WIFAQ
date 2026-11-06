/* WIFAQ clickable prototype — vanilla JS, no build step.
 * Three role-based workspaces share one demo state so actions in one role
 * appear in the others (e.g. a report approved in the Hospital Portal becomes
 * visible in the Sponsor Portal).
 */
(function () {
  "use strict";

  const STORE_KEY = "wifaq-prototype-v1";
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable: fall back to seed */ }
    return clone(window.WIFAQ_SEED);
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  let S = load();
  const ui = { role: "ops", view: "overview", caseId: null, tab: "tasks", sponsorId: "SP-A" };
  try {
    const r = sessionStorage.getItem("wifaq-role");
    if (r) Object.assign(ui, JSON.parse(r));
  } catch (e) { /* ignore */ }

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const program = (id) => byId(S.programs, id);
  const sponsor = (id) => byId(S.sponsors, id);
  const caseOf = (id) => byId(S.cases, id);
  const coord = (id) => byId(S.coordinators, id);
  const nextId = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();
  const now = () => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };
  const roleName = { ops: "WIFAQ Operations", hospital: "Hospital Portal", sponsor: "Sponsor Portal" };

  function audit(action) {
    S.audit.unshift({ when: now(), who: roleName[ui.role], action });
  }
  function commit(msg) {
    save();
    render();
    if (msg) toast(msg);
  }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function openModal(html, onMount) {
    $("#modalBody").innerHTML = html;
    $("#modal").hidden = false;
    if (onMount) onMount($("#modalBody"));
    const first = $("#modalBody").querySelector("input, select, textarea, button");
    if (first) first.focus();
  }
  function closeModal() { $("#modal").hidden = true; $("#modalBody").innerHTML = ""; }

  const statusClass = (s) => ({
    Due: "chip-red", Overdue: "chip-red", Confirmed: "chip-green", Done: "chip-green", Approved: "chip-green",
    Released: "chip-green", Requested: "chip-blue", Pending: "chip-grey", Open: "chip-red", Acknowledged: "chip-blue",
    Reviewed: "chip-green", Returned: "chip-grey", Active: "chip-green", Onboarding: "chip-blue"
  }[s] || "chip-grey");
  const chip = (s) => `<span class="chip ${statusClass(s)}">${esc(s)}</span>`;
  const icon = (t) => ({ call: "☎", appointment: "▦", document: "▤" }[t] || "•");

  /* ---------- metrics (computed from shared state) ---------- */
  function liveMetrics(programId) {
    const cases = S.cases.filter((c) => c.programId === programId);
    const ids = new Set(cases.map((c) => c.id));
    const tasks = S.tasks.filter((t) => ids.has(t.caseId));
    const calls = tasks.filter((t) => t.type === "call");
    const appts = tasks.filter((t) => t.type === "appointment");
    return {
      enrolled: cases.filter((c) => c.consent).length,
      awaitingConsent: cases.filter((c) => !c.consent).length,
      followupsDone: calls.filter((t) => t.status === "Done").length,
      followupsTotal: calls.length,
      apptsDone: appts.filter((t) => t.status === "Confirmed" || t.status === "Done").length,
      apptsTotal: appts.length,
      openEsc: S.escalations.filter((e) => ids.has(e.caseId) && e.status !== "Reviewed").length,
      approvalsDue: S.approvals.filter((a) => a.programId === programId && a.status === "Pending").length
    };
  }
  /* A released report = last released snapshot + this period's live activity */
  function buildSnapshot(programId) {
    const prev = S.reports.filter((r) => r.programId === programId).slice(-1)[0];
    const base = prev ? prev.snapshot : { enrolled: 0, followupsDone: 0, followupsTotal: 0, apptsDone: 0, apptsTotal: 0 };
    const m = liveMetrics(programId);
    return {
      enrolled: base.enrolled + m.enrolled,
      followupsDone: base.followupsDone + m.followupsDone,
      followupsTotal: base.followupsTotal + m.followupsTotal,
      apptsDone: base.apptsDone + m.apptsDone,
      apptsTotal: base.apptsTotal + m.apptsTotal
    };
  }

  /* ---------- navigation ---------- */
  const NAV = {
    ops: [["overview", "Overview"], ["cases", "My cases"], ["tasks", "Tasks"]],
    hospital: [["programs", "Programs"], ["approvals", "Approvals"], ["consent", "Consent"], ["escalations", "Escalations"], ["audit", "Audit log"]],
    sponsor: [["soverview", "Overview"], ["reports", "Reports"], ["agreement", "Agreement"]]
  };

  function renderSidebar() {
    const items = NAV[ui.role].map(([v, label]) => {
      let badge = "";
      if (v === "approvals") { const n = S.approvals.filter((a) => a.status === "Pending").length; if (n) badge = `<span class="nav-badge">${n}</span>`; }
      if (v === "escalations") { const n = S.escalations.filter((e) => e.status === "Open").length; if (n) badge = `<span class="nav-badge">${n}</span>`; }
      if (v === "consent") { const n = S.cases.filter((c) => !c.consent).length; if (n) badge = `<span class="nav-badge">${n}</span>`; }
      const active = ui.view === v || (v === "cases" && ui.view === "case");
      return `<button class="nav-item ${active ? "active" : ""}" data-view="${v}">${esc(label)}${badge}</button>`;
    }).join("");
    let extra = "";
    if (ui.role === "sponsor") {
      extra = `<div class="side-section"><label class="side-label" for="sponsorSel">Signed in as</label>
        <select id="sponsorSel">${S.sponsors.map((s) => `<option value="${s.id}" ${s.id === ui.sponsorId ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        <p class="side-note">Sponsors see aggregate, hospital-released data for their own program only.</p></div>`;
    } else if (ui.role === "hospital") {
      extra = `<div class="side-section"><span class="side-label">Signed in as</span><p class="side-user">Program administrator</p>
        <p class="side-note">${esc(S.hospital.name)} controls scope, consent and every report release.</p></div>`;
    } else {
      extra = `<div class="side-section"><span class="side-label">Signed in as</span><p class="side-user">Sara (Coordinator)</p>
        <p class="side-note">Clinical decisions stay with the hospital team. Escalate anything clinical.</p></div>`;
    }
    $("#sidebar").innerHTML = `<div class="side-title">${esc(roleName[ui.role])}</div><nav class="nav">${items}</nav>${extra}`;
  }

  /* ---------- OPERATIONS ---------- */
  function myCases() { return S.cases.filter((c) => c.coordinatorId === "C1" || c.coordinatorId === "C2" || c.coordinatorId === "C3"); }

  function viewOverview() {
    const cases = myCases();
    const ids = new Set(cases.map((c) => c.id));
    const open = S.tasks.filter((t) => ids.has(t.caseId) && t.status !== "Done" && t.status !== "Confirmed");
    const today = open.filter((t) => t.due === "Today");
    const esc_ = S.escalations.filter((e) => e.status === "Open");
    const noConsent = cases.filter((c) => !c.consent);
    return `
      <div class="page-head"><div><p class="eyebrow">WIFAQ Operations</p><h1>Overview</h1>
      <p class="sub">All approved programs at ${esc(S.hospital.name)}, in one workflow.</p></div></div>
      <div class="kpis">
        ${kpi(open.length, "Open tasks")}${kpi(today.length, "Due today")}${kpi(esc_.length, "Open escalations")}${kpi(noConsent.length, "Awaiting consent")}
      </div>
      <section class="card"><div class="card-head"><h2>Cases across programs</h2><span class="muted">${cases.length} cases · ${S.programs.length} sponsor programs</span></div>
      <table class="table"><thead><tr><th>Case</th><th>Program</th><th>Sponsor</th><th>Coordinator</th><th>Consent</th><th>Status</th><th></th></tr></thead><tbody>
      ${cases.map((c) => { const p = program(c.programId); return `<tr>
        <td><strong>${esc(c.id)}</strong></td><td>${esc(p.name)}</td><td>${esc(sponsor(p.sponsorId).name)}</td>
        <td>${esc(coord(c.coordinatorId).name.split(" ")[0])}</td>
        <td>${c.consent ? '<span class="chip chip-green">Verified</span>' : '<span class="chip chip-grey">Not yet</span>'}</td>
        <td>${chip(c.status)}</td><td><button class="link-btn" data-open-case="${c.id}">Open</button></td></tr>`; }).join("")}
      </tbody></table></section>`;
  }
  const kpi = (n, l) => `<div class="kpi"><div class="kpi-n">${esc(n)}</div><div class="kpi-l">${esc(l)}</div></div>`;

  function viewCases() {
    return `<div class="page-head"><div><p class="eyebrow">WIFAQ Operations</p><h1>My cases</h1></div></div>
      <div class="case-grid">${myCases().map((c) => { const p = program(c.programId); const open = S.tasks.filter((t) => t.caseId === c.id && t.status !== "Done" && t.status !== "Confirmed").length;
        return `<button class="case-card" data-open-case="${c.id}">
          <div class="case-card-top"><strong>Case ${esc(c.id)}</strong>${chip(c.status)}</div>
          <div class="muted">${esc(p.name)} · ${esc(sponsor(p.sponsorId).name)}</div>
          <div class="case-card-row">${c.consent ? '<span class="chip chip-green">Consent verified</span>' : '<span class="chip chip-grey">Consent pending</span>'}<span class="muted">${open} open tasks</span></div>
        </button>`; }).join("")}</div>`;
  }

  function viewCase() {
    const c = caseOf(ui.caseId);
    if (!c) { ui.view = "cases"; return viewCases(); }
    const p = program(c.programId);
    const tasks = S.tasks.filter((t) => t.caseId === c.id);
    const contacts = S.contacts.filter((l) => l.caseId === c.id);
    const escs = S.escalations.filter((e) => e.caseId === c.id);
    const tabs = [["tasks", "Tasks"], ["history", "Contact history"], ["docs", "Documents"]];
    let body = "";
    if (ui.tab === "tasks") {
      body = `<div class="card-head"><h2>Care plan</h2><button class="primary-btn" id="addTask">+ Add task</button></div>
        <table class="table"><thead><tr><th></th><th>Task</th><th>Due</th><th>Status</th></tr></thead><tbody>
        ${tasks.map((t) => `<tr><td class="ico">${icon(t.type)}</td><td>${esc(t.title)}</td><td>${esc(t.due)}</td>
          <td><select class="status-sel ${statusClass(t.status)}" data-task="${t.id}" aria-label="Status for ${esc(t.title)}">
          ${["Due", "Requested", "Pending", "Confirmed", "Done"].map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")}
        </tbody></table>`;
    } else if (ui.tab === "history") {
      body = `<div class="card-head"><h2>Contact history</h2></div>
        ${contacts.length ? `<ul class="timeline">${contacts.map((l) => `<li><span class="tl-when">${esc(l.when)}</span><span class="tl-ch">${esc(l.channel)}</span><span>${esc(l.outcome)}</span>${l.ae ? '<span class="chip chip-red">AE forwarded to sponsor PV</span>' : ""}</li>`).join("")}</ul>` : '<p class="muted">No contacts logged yet.</p>'}`;
    } else {
      body = `<div class="card-head"><h2>Documents</h2></div>
        <div class="doc-row"><span class="doc">▤ Hospital referral</span><span class="doc">▤ Consent form ${c.consent ? "(verified)" : "(pending)"}</span>
        <span class="doc">▤ ${esc(p.name)} education pack ${S.approvals.find((a) => a.programId === p.id && a.kind === "Education material" && a.status === "Approved") ? "v2 (approved)" : "v1"}</span></div>`;
    }
    return `
      <p class="crumbs"><button class="link-btn" data-view="cases">My cases</button> / ${esc(c.id)}</p>
      <div class="page-head"><div><h1>Case ${esc(c.id)} ${chip(c.status)}</h1>
        <p class="sub">${esc(p.name)} · ${esc(sponsor(p.sponsorId).name)} · Coordinator: ${esc(coord(c.coordinatorId).name.split(" ")[0])}</p>
        <div class="chips">${c.consent ? '<span class="chip chip-green">✓ Consent verified</span>' : '<span class="chip chip-grey">Consent not verified: outreach blocked</span>'}
        ${c.caregiverAuthorized ? '<span class="chip chip-green">✓ Caregiver contact authorized</span>' : '<span class="chip chip-grey">Caregiver contact not authorized</span>'}</div></div></div>
      <div class="two-col">
        <section class="card">
          <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${ui.tab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
          ${body}
        </section>
        <div class="stack">
          <section class="card"><h2>Next contact</h2>
            <p class="muted">${esc(c.contact)}</p><p>${esc(c.nextAction)}</p>
            <button class="primary-btn" id="logCall" ${c.consent ? "" : "disabled title=\"Outreach is blocked until the hospital verifies consent\""}>Log call</button>
            ${c.consent ? "" : '<p class="warn">Outreach is blocked until the hospital verifies consent.</p>'}
          </section>
          <section class="card"><h2>Escalations</h2>
            ${escs.length ? escs.map((e) => `<div class="esc-row">${chip(e.status)}<span>${esc(e.reason)}</span></div>`).join("") : '<p class="muted">None for this case.</p>'}
            <button class="outline-btn danger" id="escalate">Escalate to clinical team</button>
            <p class="fine">Orders and clinical decisions remain with the hospital.</p>
          </section>
        </div>
      </div>`;
  }

  function viewTasks() {
    const open = S.tasks.filter((t) => t.status !== "Done");
    return `<div class="page-head"><div><p class="eyebrow">WIFAQ Operations</p><h1>Tasks</h1><p class="sub">Every open task, across all sponsor programs.</p></div></div>
      <section class="card"><table class="table"><thead><tr><th></th><th>Task</th><th>Case</th><th>Program</th><th>Due</th><th>Status</th></tr></thead><tbody>
      ${open.map((t) => { const c = caseOf(t.caseId); return `<tr><td class="ico">${icon(t.type)}</td><td>${esc(t.title)}</td>
        <td><button class="link-btn" data-open-case="${c.id}">${esc(c.id)}</button></td><td>${esc(program(c.programId).name)}</td><td>${esc(t.due)}</td><td>${chip(t.status)}</td></tr>`; }).join("")}
      </tbody></table></section>`;
  }

  /* ---------- HOSPITAL ---------- */
  function viewPrograms() {
    return `<div class="page-head"><div><p class="eyebrow">Hospital Portal</p><h1>Programs</h1>
      <p class="sub">Sponsor programs approved to run through WIFAQ at ${esc(S.hospital.name)}.</p></div></div>
      ${S.programs.map((p) => { const m = liveMetrics(p.id); return `<section class="card">
        <div class="card-head"><div><h2>${esc(p.name)}</h2><p class="muted">Program ${esc(p.id)} · Owner: ${esc(p.owner)} · Sponsor: ${esc(sponsor(p.sponsorId).name)}</p></div>${chip(p.status)}</div>
        <div class="kpis small">${kpi(m.enrolled, "Enrolled (consented)")}${kpi(m.approvalsDue, "Approvals due")}${kpi(m.openEsc, "Open escalations")}${kpi(m.awaitingConsent, "Awaiting consent")}</div>
        <p class="muted"><strong>Approved scope:</strong> ${esc(p.scope)}</p>
        <p class="muted"><strong>Team access:</strong> ${S.coordinators.map((c) => esc(c.name.split(" ")[0])).join(", ")} (assigned coordinators)</p>
      </section>`; }).join("")}`;
  }

  function viewApprovals() {
    const rows = S.approvals;
    return `<div class="page-head"><div><p class="eyebrow">Hospital Portal</p><h1>Approval queue</h1>
      <p class="sub">Nothing reaches patients or sponsors until the hospital approves it.</p></div></div>
      <section class="card"><table class="table"><thead><tr><th>Item</th><th>Program</th><th>Type</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map((a) => `<tr><td>▤ ${esc(a.title)}</td><td>${esc(program(a.programId).name)}</td><td>${esc(a.kind)}</td><td>${esc(a.submitted)}</td><td>${chip(a.status)}</td>
        <td>${a.status === "Pending" ? `<button class="outline-btn" data-review="${a.id}">Review</button>` : ""}</td></tr>`).join("")}
      </tbody></table></section>`;
  }

  function viewConsent() {
    const pending = S.cases.filter((c) => !c.consent);
    return `<div class="page-head"><div><p class="eyebrow">Hospital Portal</p><h1>Consent</h1>
      <p class="sub">WIFAQ can contact a patient only after the hospital records verified consent.</p></div></div>
      <section class="card">${pending.length ? `<table class="table"><thead><tr><th>Case</th><th>Program</th><th>Contact preference</th><th></th></tr></thead><tbody>
      ${pending.map((c) => `<tr><td><strong>${esc(c.id)}</strong></td><td>${esc(program(c.programId).name)}</td><td>${esc(c.contact)}</td>
        <td><button class="primary-btn" data-consent="${c.id}">Record consent verified</button></td></tr>`).join("")}</tbody></table>`
        : '<p class="muted">All enrolled cases have verified consent.</p>'}</section>`;
  }

  function viewEscalations() {
    return `<div class="page-head"><div><p class="eyebrow">Hospital Portal</p><h1>Clinical escalations</h1>
      <p class="sub">Raised by WIFAQ coordinators; reviewed by the hospital clinical team.</p></div></div>
      <section class="card">${S.escalations.length ? `<table class="table"><thead><tr><th>Case</th><th>Reason</th><th>Raised</th><th>Status</th><th></th></tr></thead><tbody>
      ${S.escalations.map((e) => `<tr><td><strong>${esc(e.caseId)}</strong></td><td>${esc(e.reason)}${e.ae ? ' <span class="chip chip-red">Possible AE</span>' : ""}</td><td>${esc(e.raised)}</td><td>${chip(e.status)}</td>
        <td>${e.status === "Open" ? `<button class="outline-btn" data-ack="${e.id}">Acknowledge</button>` : e.status === "Acknowledged" ? `<button class="outline-btn" data-reviewed="${e.id}">Mark reviewed</button>` : ""}</td></tr>`).join("")}
      </tbody></table>` : '<p class="muted">No escalations.</p>'}</section>`;
  }

  function viewAudit() {
    return `<div class="page-head"><div><p class="eyebrow">Hospital Portal</p><h1>Audit log</h1><p class="sub">Every approval, release, consent and escalation is recorded.</p></div></div>
      <section class="card"><table class="table"><thead><tr><th>When</th><th>Workspace</th><th>Action</th></tr></thead><tbody>
      ${S.audit.map((a) => `<tr><td class="nowrap">${esc(a.when)}</td><td>${esc(a.who)}</td><td>${esc(a.action)}</td></tr>`).join("")}</tbody></table></section>`;
  }

  /* ---------- SPONSOR ---------- */
  function sponsorProgram() { return S.programs.find((p) => p.sponsorId === ui.sponsorId); }
  function viewSOverview() {
    const p = sponsorProgram();
    const released = S.reports.filter((r) => r.programId === p.id && r.status === "Released");
    const last = released.slice(-1)[0];
    const s = last ? last.snapshot : null;
    return `<div class="page-head"><div><p class="eyebrow">Sponsor Portal · ${esc(sponsor(ui.sponsorId).name)}</p><h1>${esc(p.name)}</h1>
      <p class="sub">Program ${esc(p.id)} · Latest released period: ${last ? esc(last.period) : "none yet"}</p></div></div>
      <div class="notice">🔒 Aggregate reporting only · Your own program only · Every figure released by the hospital</div>
      ${s ? `<div class="kpis">${kpi(s.enrolled, "Enrolled")}${kpi(`${s.followupsDone} / ${s.followupsTotal}`, "Follow-ups completed")}${kpi(`${s.apptsDone} / ${s.apptsTotal}`, "Appointments coordinated")}</div>` : ""}
      ${reportsTable(released)}`;
  }
  function reportsTable(released) {
    return `<section class="card"><div class="card-head"><h2>Released reports</h2></div>
      <table class="table"><thead><tr><th>Report</th><th>Status</th><th></th></tr></thead><tbody>
      ${released.slice().reverse().map((r) => `<tr><td>▤ ${esc(r.period)}</td><td>${chip("Approved")}</td><td><button class="outline-btn" data-download="${r.id}">Download CSV</button></td></tr>`).join("")}
      </tbody></table></section>`;
  }
  function viewReports() {
    const p = sponsorProgram();
    return `<div class="page-head"><div><p class="eyebrow">Sponsor Portal · ${esc(sponsor(ui.sponsorId).name)}</p><h1>Reports</h1></div></div>
      ${reportsTable(S.reports.filter((r) => r.programId === p.id && r.status === "Released"))}
      <p class="fine">Draft reports awaiting hospital approval are not visible to sponsors.</p>`;
  }
  function viewAgreement() {
    const p = sponsorProgram();
    return `<div class="page-head"><div><p class="eyebrow">Sponsor Portal · ${esc(sponsor(ui.sponsorId).name)}</p><h1>Agreement</h1></div></div>
      <section class="card"><dl class="dl">
        <dt>Program</dt><dd>${esc(p.name)} (${esc(p.id)})</dd>
        <dt>Hospital</dt><dd>${esc(S.hospital.name)}, ${esc(S.hospital.city)}</dd>
        <dt>Service scope</dt><dd>${esc(p.scope)}</dd>
        <dt>Data access</dt><dd>Aggregate, de-identified reporting for this program only, after hospital release</dd>
        <dt>Safety reporting</dt><dd>Possible adverse events captured during contacts are forwarded to the sponsor's pharmacovigilance team</dd>
        <dt>Clinical decisions</dt><dd>Remain with the hospital care team</dd>
      </dl></section>`;
  }

  /* ---------- render ---------- */
  const VIEWS = {
    overview: viewOverview, cases: viewCases, case: viewCase, tasks: viewTasks,
    programs: viewPrograms, approvals: viewApprovals, consent: viewConsent, escalations: viewEscalations, audit: viewAudit,
    soverview: viewSOverview, reports: viewReports, agreement: viewAgreement
  };
  function render() {
    document.querySelectorAll(".role-btn").forEach((b) => {
      const on = b.dataset.role === ui.role;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    document.body.dataset.role = ui.role;
    renderSidebar();
    $("#main").innerHTML = (VIEWS[ui.view] || VIEWS[NAV[ui.role][0][0]])();
    try { sessionStorage.setItem("wifaq-role", JSON.stringify(ui)); } catch (e) { /* ignore */ }
  }

  /* ---------- actions ---------- */
  function addTaskModal() {
    openModal(`<h2 id="modalTitle">Add task to ${esc(ui.caseId)}</h2>
      <form id="f" class="form">
        <label>Task<input name="title" required maxlength="80" placeholder="e.g. Pharmacy refill reminder"></label>
        <label>Type<select name="type"><option value="call">Call / follow-up</option><option value="appointment">Appointment</option><option value="document">Document</option></select></label>
        <label>Due<input name="due" required maxlength="20" value="Today"></label>
        <div class="form-actions"><button type="button" class="ghost-btn dark" data-close>Cancel</button><button class="primary-btn">Add task</button></div>
      </form>`, (root) => {
      $("#f", root).addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        S.tasks.push({ id: nextId("T"), caseId: ui.caseId, title: fd.get("title").trim(), type: fd.get("type"), due: fd.get("due").trim(), status: "Due" });
        audit(`Added task "${fd.get("title").trim()}" to case ${ui.caseId}`);
        closeModal(); commit("Task added");
      });
    });
  }

  function logCallModal() {
    openModal(`<h2 id="modalTitle">Log contact · ${esc(ui.caseId)}</h2>
      <form id="f" class="form">
        <label>Channel<select name="channel"><option>Phone</option><option>WhatsApp</option><option>SMS</option></select></label>
        <label>Outcome<textarea name="outcome" required maxlength="200" rows="3" placeholder="What was discussed or agreed"></textarea></label>
        <label class="check"><input type="checkbox" name="ae"> Patient or caregiver reported a possible side effect / adverse event</label>
        <p class="fine">Possible adverse events are forwarded to the sponsor's pharmacovigilance team and escalated to the hospital clinical team.</p>
        <div class="form-actions"><button type="button" class="ghost-btn dark" data-close>Cancel</button><button class="primary-btn">Save contact</button></div>
      </form>`, (root) => {
      $("#f", root).addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const ae = !!fd.get("ae");
        const outcome = fd.get("outcome").trim();
        S.contacts.unshift({ id: nextId("L"), caseId: ui.caseId, when: now(), channel: fd.get("channel"), outcome, ae });
        const due = S.tasks.find((t) => t.caseId === ui.caseId && t.type === "call" && t.status === "Due");
        if (due) due.status = "Done";
        audit(`Logged ${fd.get("channel")} contact for case ${ui.caseId}${due ? ` (completed "${due.title}")` : ""}`);
        if (ae) {
          S.escalations.unshift({ id: nextId("E"), caseId: ui.caseId, reason: "Possible adverse event reported: " + outcome, raised: now(), status: "Open", ae: true });
          audit(`Possible adverse event on case ${ui.caseId} forwarded to sponsor PV and escalated to hospital`);
        }
        closeModal(); commit(ae ? "Contact saved · AE forwarded and escalated" : "Contact saved");
      });
    });
  }

  function escalateModal() {
    openModal(`<h2 id="modalTitle">Escalate ${esc(ui.caseId)} to clinical team</h2>
      <form id="f" class="form">
        <label>Reason<textarea name="reason" required maxlength="200" rows="3" placeholder="Describe what needs clinical review"></textarea></label>
        <div class="form-actions"><button type="button" class="ghost-btn dark" data-close>Cancel</button><button class="primary-btn danger-bg">Escalate</button></div>
      </form>`, (root) => {
      $("#f", root).addEventListener("submit", (ev) => {
        ev.preventDefault();
        const reason = new FormData(ev.target).get("reason").trim();
        S.escalations.unshift({ id: nextId("E"), caseId: ui.caseId, reason, raised: now(), status: "Open", ae: false });
        audit(`Escalated case ${ui.caseId} to hospital clinical team`);
        closeModal(); commit("Escalated to the hospital clinical team");
      });
    });
  }

  function reviewModal(id) {
    const a = byId(S.approvals, id);
    const p = program(a.programId);
    let preview = `<p>${esc(a.title)} for ${esc(p.name)}.</p>`;
    if (a.kind === "Sponsor report") {
      const s = buildSnapshot(a.programId);
      preview = `<p>Aggregate figures that ${esc(sponsor(p.sponsorId).name)} will see for ${esc(a.period)}:</p>
        <div class="kpis small">${kpi(s.enrolled, "Enrolled")}${kpi(`${s.followupsDone} / ${s.followupsTotal}`, "Follow-ups")}${kpi(`${s.apptsDone} / ${s.apptsTotal}`, "Appointments")}</div>
        <p class="fine">No names, contact details or case IDs are included.</p>`;
    }
    openModal(`<h2 id="modalTitle">Review: ${esc(a.title)}</h2><p class="muted">${esc(a.kind)} · ${esc(p.name)} · submitted ${esc(a.submitted)}</p>${preview}
      <div class="form-actions"><button class="ghost-btn dark" data-return="${a.id}">Return to WIFAQ</button>
      <button class="primary-btn" data-approve="${a.id}">${a.kind === "Sponsor report" ? "Approve & release" : "Approve"}</button></div>`);
  }

  function approve(id) {
    const a = byId(S.approvals, id);
    a.status = "Approved";
    if (a.kind === "Sponsor report") {
      S.reports.push({ id: nextId("R"), programId: a.programId, period: a.period, status: "Released", snapshot: buildSnapshot(a.programId) });
      audit(`Approved and released ${a.period} report for ${program(a.programId).name} to ${sponsor(program(a.programId).sponsorId).name}`);
    } else {
      audit(`Approved ${a.title} for ${program(a.programId).name}`);
    }
    closeModal(); commit(a.kind === "Sponsor report" ? "Report released to sponsor" : "Approved");
  }

  function downloadCsv(id) {
    const r = byId(S.reports, id);
    const p = program(r.programId);
    const s = r.snapshot;
    const rows = [["Program", "Period", "Enrolled", "Follow-ups completed", "Follow-ups planned", "Appointments coordinated", "Appointments planned"],
      [p.name, r.period, s.enrolled, s.followupsDone, s.followupsTotal, s.apptsDone, s.apptsTotal]];
    const csv = "DEMO DATA - fictional figures\n" + rows.map((x) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const aEl = document.createElement("a");
    aEl.href = url; aEl.download = `WIFAQ_${p.id}_${r.period.replace(/\s+/g, "_")}_aggregate.csv`;
    document.body.appendChild(aEl); aEl.click(); aEl.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Aggregate report downloaded");
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("button");
    if (!t) { if (ev.target.id === "modal") closeModal(); return; }
    const d = t.dataset;
    if (d.role) { ui.role = d.role; ui.view = NAV[d.role][0][0]; ui.caseId = null; render(); $("#main").focus(); return; }
    if (d.view) { ui.view = d.view; ui.caseId = null; render(); return; }
    if (d.openCase) { if (ui.role !== "ops") ui.role = "ops"; ui.view = "case"; ui.caseId = d.openCase; ui.tab = "tasks"; render(); return; }
    if (d.tab) { ui.tab = d.tab; render(); return; }
    if (d.close !== undefined) { closeModal(); return; }
    if (d.review) return reviewModal(d.review);
    if (d.approve) return approve(d.approve);
    if (d.return) { const a = byId(S.approvals, d.return); a.status = "Returned"; audit(`Returned ${a.title} to WIFAQ for changes`); closeModal(); return commit("Returned to WIFAQ"); }
    if (d.consent) { const c = caseOf(d.consent); c.consent = true; if (c.status === "Onboarding") c.status = "Active";
      const tk = S.tasks.find((x) => x.caseId === c.id && /consent/i.test(x.title)); if (tk) tk.status = "Done";
      c.nextAction = "Welcome call and onboarding."; audit(`Recorded verified consent for case ${c.id}`); return commit(`Consent recorded for ${c.id}`); }
    if (d.ack) { byId(S.escalations, d.ack).status = "Acknowledged"; audit(`Acknowledged escalation on case ${byId(S.escalations, d.ack).caseId}`); return commit("Escalation acknowledged"); }
    if (d.reviewed) { byId(S.escalations, d.reviewed).status = "Reviewed"; audit(`Clinical review completed for case ${byId(S.escalations, d.reviewed).caseId}`); return commit("Marked reviewed"); }
    if (d.download) return downloadCsv(d.download);
    if (t.id === "addTask") return addTaskModal();
    if (t.id === "logCall") return logCallModal();
    if (t.id === "escalate") return escalateModal();
    if (t.id === "resetBtn") { S = clone(window.WIFAQ_SEED); ui.view = NAV[ui.role][0][0]; ui.caseId = null; return commit("Demo data reset"); }
  });
  document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el.dataset.task) {
      const t = byId(S.tasks, el.dataset.task);
      t.status = el.value; audit(`Set "${t.title}" on case ${t.caseId} to ${el.value}`); commit();
    } else if (el.id === "sponsorSel") { ui.sponsorId = el.value; render(); }
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !$("#modal").hidden) closeModal(); });

  render();
})();
