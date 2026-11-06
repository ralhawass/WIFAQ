/* WIFAQ prototype — seed demo data.
 * Every patient, caregiver, coordinator, sponsor and figure here is FICTIONAL.
 * No real patient data is used or stored anywhere in this prototype.
 */
window.WIFAQ_SEED = {
  hospital: { name: "Demo Specialist Hospital", city: "Riyadh" },

  sponsors: [
    { id: "SP-A", name: "Demo Pharma A" },
    { id: "SP-B", name: "Demo Pharma B" }
  ],

  programs: [
    { id: "AD-01", name: "Early Alzheimer's Support", sponsorId: "SP-A", owner: "Neurology",
      status: "Active", scope: "Coordination, caregiver education and follow-up reporting" },
    { id: "HF-02", name: "Heart Failure Support", sponsorId: "SP-B", owner: "Cardiology",
      status: "Active", scope: "Onboarding, adherence follow-up and appointment coordination" }
  ],

  coordinators: [
    { id: "C1", name: "Sara (Coordinator)", initials: "SA" },
    { id: "C2", name: "Nora (Coordinator)", initials: "NO" },
    { id: "C3", name: "Fahad (Coordinator)", initials: "FA" }
  ],

  cases: [
    { id: "AD-104", programId: "AD-01", label: "Patient AD-104", coordinatorId: "C1", status: "Active",
      consent: true, caregiverAuthorized: true, contact: "Caregiver · Phone · Arabic",
      nextAction: "Confirm MRI appointment and transport needs." },
    { id: "AD-107", programId: "AD-01", label: "Patient AD-107", coordinatorId: "C1", status: "Active",
      consent: true, caregiverAuthorized: false, contact: "Patient · Phone · English",
      nextAction: "Send education pack once approved." },
    { id: "AD-112", programId: "AD-01", label: "Patient AD-112", coordinatorId: "C2", status: "Onboarding",
      consent: false, caregiverAuthorized: false, contact: "Patient · Phone · Arabic",
      nextAction: "Awaiting signed consent from the clinic." },
    { id: "HF-201", programId: "HF-02", label: "Patient HF-201", coordinatorId: "C3", status: "Active",
      consent: true, caregiverAuthorized: true, contact: "Caregiver · WhatsApp · Arabic",
      nextAction: "Two-week adherence check-in." },
    { id: "HF-204", programId: "HF-02", label: "Patient HF-204", coordinatorId: "C3", status: "Active",
      consent: true, caregiverAuthorized: false, contact: "Patient · Phone · Arabic",
      nextAction: "Coordinate echo appointment." }
  ],

  tasks: [
    { id: "T1", caseId: "AD-104", title: "Caregiver follow-up", type: "call", due: "Today", status: "Due" },
    { id: "T2", caseId: "AD-104", title: "MoCA appointment", type: "appointment", due: "16 Oct", status: "Confirmed" },
    { id: "T3", caseId: "AD-104", title: "Brain MRI booking", type: "appointment", due: "18 Oct", status: "Requested" },
    { id: "T4", caseId: "AD-104", title: "Ordered lab results", type: "document", due: "Today", status: "Pending" },
    { id: "T5", caseId: "AD-107", title: "Welcome call", type: "call", due: "Today", status: "Done" },
    { id: "T6", caseId: "AD-107", title: "Medication education session", type: "call", due: "15 Oct", status: "Due" },
    { id: "T7", caseId: "AD-112", title: "Collect signed consent", type: "document", due: "14 Oct", status: "Pending" },
    { id: "T8", caseId: "HF-201", title: "Adherence check-in", type: "call", due: "Today", status: "Due" },
    { id: "T9", caseId: "HF-201", title: "Cardiology clinic visit", type: "appointment", due: "20 Oct", status: "Confirmed" },
    { id: "T10", caseId: "HF-204", title: "Echo appointment", type: "appointment", due: "22 Oct", status: "Requested" }
  ],

  contacts: [
    { id: "L1", caseId: "AD-104", when: "Yesterday", channel: "Phone", outcome: "Caregiver education call completed", ae: false },
    { id: "L2", caseId: "AD-104", when: "09:40", channel: "System", outcome: "Radiology booking request sent", ae: false },
    { id: "L3", caseId: "HF-201", when: "12 Oct", channel: "WhatsApp", outcome: "Reminder sent; caregiver confirmed", ae: false }
  ],

  /* Items that need hospital approval before WIFAQ can use or release them */
  approvals: [
    { id: "A1", programId: "AD-01", kind: "Education material", title: "Patient education pack v2", submitted: "12 Oct", status: "Pending" },
    { id: "A2", programId: "AD-01", kind: "Sponsor report", title: "October aggregate report", submitted: "13 Oct", status: "Pending", period: "October 2026" },
    { id: "A3", programId: "HF-02", kind: "Sponsor report", title: "October aggregate report", submitted: "13 Oct", status: "Pending", period: "October 2026" }
  ],

  /* Reports already approved and released by the hospital */
  reports: [
    { id: "R1", programId: "AD-01", period: "September 2026", status: "Released",
      snapshot: { enrolled: 22, followupsDone: 38, followupsTotal: 42, apptsDone: 12, apptsTotal: 14 } },
    { id: "R2", programId: "HF-02", period: "September 2026", status: "Released",
      snapshot: { enrolled: 17, followupsDone: 29, followupsTotal: 31, apptsDone: 9, apptsTotal: 10 } }
  ],

  escalations: [
    { id: "E1", caseId: "HF-204", reason: "Patient reports new ankle swelling; needs clinical review", raised: "Today 08:15", status: "Open", ae: false }
  ],

  audit: [
    { when: "13 Oct 10:02", who: "WIFAQ Operations", action: "Submitted October aggregate reports for approval (AD-01, HF-02)" },
    { when: "12 Oct 14:30", who: "WIFAQ Operations", action: "Submitted Patient education pack v2 for approval (AD-01)" },
    { when: "01 Oct 09:00", who: "Hospital Portal", action: "Released September reports to sponsors" }
  ]
};
