# Release 5: Chains and Disagreements

Done 2026-10-03; works on the claude.ai page and the hosted app alike.

- Key Events (CONTEXT.md): sessions of kind lab, workshop, interview, seminar and exam, and the
  assessments of kind exam. Each one's Prep: for an exam, what it needs (`needsOf`, from
  `NEEDS_LP2` and the module structure); for a Z0025E lab session, its booking task, its report
  and what the report needs (`BOOKINGS` ties them); for other sessions, their `prep` refs.
- Taught Date: the session on the item's page, else its study week. A Taught Date after the Key
  Event is marked "taught after it is needed". Without one, a hollow Do-By Date two days before.
- All deadlines opens with the Key Events, the next two unfolded, each showing how much of its Prep
  is ready (Tick or Canvas Completion). The flat table stays below.
- The map opens on the next Key Event; Key event ▶ and ◀ step through them.
- Disagreements: `DISAGREEMENTS` in `data/plan.mjs`, checked by the build. Rows show "sources
  disagree" with every source; for a deadline the earliest value not yet past is used until
  `settled` names the source to trust (so Z0025E lab reports show the session start, not 23:59).
  Each course's list copies as a report for its teacher.

Not linked yet in the plan, so their Chains are empty: Workshops 2, 5 and 6, the final seminar and
the oral exam. Adding `prep` refs to those sessions in `data/plan.mjs` fills them.
