## 2026-08-31T05:36:08Z

Dispatch message:
Investigate the codebase structure, frameworks, package.json, tech stack, and state management.
Investigate Firebase configuration, data synchronization, Heatmap (learning matrix) data flow, LexiCredit balance display on Header vs Profile, and offline/error handling.
Identify where Heatmap data loss occurs and why LexiCredit balance gets out of sync or shows discrepancies.
Identify how to enforce strict Firebase sync: any score/study history update must sync to Firebase immediately; if sync fails (network/API error), display red warning alert and do NOT persist erroneous local state.
Identify existing tests and test runner infrastructure.
Write comprehensive report to report.md and handoff to handoff.md.
