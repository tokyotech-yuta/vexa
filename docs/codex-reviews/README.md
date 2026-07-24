# codex-reviews — release review artifacts (fork-local)

Codex CLI release-review artifacts for this fork, per the operator's global review policy:
every PR to `main` (and large integrations) gets a Codex review whose punchlist, remediation
status, and handoff notes are saved here as one Markdown file per review round.

Naming: `PR-<n>-main-<YYYY-MM-DD>.md` (main-bound PRs), `<topic>-<YYYY-MM-DD>.md` (ad-hoc),
`retro-PR-<n>-<YYYY-MM-DD>.md` (retrospective after a hotfix skip). Each file carries the
review metadata (thread ID, model, base..head, scope), the priority-tiered punchlist, and the
fix status per item.

This directory exists only in the tokyotech-yuta fork — it is not an upstream surface.
