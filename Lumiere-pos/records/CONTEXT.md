# records — the record library

Records accumulate; nothing here "runs." Shape is uniform because every record is a copy of a
template from `_templates/`.

| Area | Record | Template |
|---|---|---|
| `clients/` | one folder per client (`<id>-<slug>/`) | `record-client.md` |
| `staff/` | one folder per staff member | `record-staff.md` |
| `inventory/` | one folder per product | `record-inventory.md` |
| `sales/` | signed tickets, bucketed by week | `visit-ticket.md` |

## Status

What exists and its status is declared in `_index/log.md`. Status lifecycle:
`briefed → active → archived`. Old records move to `_archive/`, never deleted.

## Rules

- Never store tips, and never store computed commission here — commission lives only in
  `settlement/`.
- Tickets are signed once at `05_payment` and never edited afterward.
- New-vs-returning comes from `records/clients/*/first-visit-date` plus visit files.
